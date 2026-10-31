const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../models/User");
const EmailVerification = require("../models/EmailVerification");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

const PASSWORD_RULE =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,72}$/;

function createToken(userId) {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "1d" });
}

function getPublicUser(user) {
  return {
    id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
  };
}

function getMailer() {
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASSWORD
  ) {
    throw new Error("Email delivery is not configured.");
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

router.post("/signup/send-code", async (req, res) => {
  try {
    const { username, email } = req.body || {};
    const role = req.body?.role === "restaurant" ? "restaurant" : "customer";
    const cleanUsername = typeof username === "string" ? username.trim() : "";
    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (
      !cleanUsername ||
      cleanUsername.length > 16 ||
      cleanEmail.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid username and email address.",
      });
    }

    if (await User.exists({ email: cleanEmail })) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const existingVerification = await EmailVerification.findOne({
      email: cleanEmail,
    });

    if (existingVerification && existingVerification.resendAfter > new Date()) {
      return res.status(429).json({
        success: false,
        message: "Wait a minute before requesting another code.",
      });
    }

    const code = String(crypto.randomInt(100000, 1000000));
    const codeHash = await bcrypt.hash(code, 10);

    await EmailVerification.findOneAndUpdate(
      { email: cleanEmail },
      {
        email: cleanEmail,
        username: cleanUsername,
        role,
        codeHash,
        attempts: 0,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        resendAfter: new Date(Date.now() + 60 * 1000),
        verifiedAt: null,
        signupTokenHash: null,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await getMailer().sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: cleanEmail,
      subject: "Your FoodEase verification code",
      text: `Your FoodEase verification code is ${code}. It expires in 10 minutes.`,
    });

    return res.status(200).json({
      success: true,
      message: "Verification code sent.",
    });
  } catch (error) {
    console.error("Verification email error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Could not send the verification code. Please try again.",
    });
  }
});

router.post("/signup/verify-code", async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const code = String(req.body?.code || "").trim();
    const verification = await EmailVerification.findOne({ email });

    if (!verification || verification.expiresAt <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "The code expired. Request a new one.",
      });
    }

    if (verification.attempts >= 5) {
      return res.status(429).json({
        success: false,
        message: "Too many attempts. Request a new code.",
      });
    }

    verification.attempts += 1;

    if (!(await bcrypt.compare(code, verification.codeHash))) {
      await verification.save();
      return res.status(400).json({
        success: false,
        message: "That code is incorrect.",
      });
    }

    const signupToken = crypto.randomBytes(32).toString("hex");
    verification.verifiedAt = new Date();
    verification.signupTokenHash = crypto
      .createHash("sha256")
      .update(signupToken)
      .digest("hex");

    await verification.save();

    return res.status(200).json({ success: true, signupToken });
  } catch (error) {
    console.error("Code verification error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Could not verify the code. Please try again.",
    });
  }
});

router.post("/signup/complete", async (req, res) => {
  try {
    const { signupToken, password } = req.body || {};

    if (typeof signupToken !== "string" || typeof password !== "string") {
      return res.status(400).json({
        success: false,
        message: "Verify your email and enter a password.",
      });
    }

    if (!PASSWORD_RULE.test(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be 8–72 characters and include an uppercase letter, a lowercase letter, a number, and a symbol.",
      });
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(signupToken)
      .digest("hex");

    const verification = await EmailVerification.findOne({
      signupTokenHash: tokenHash,
      verifiedAt: { $ne: null },
      expiresAt: { $gt: new Date() },
    });

    if (!verification) {
      return res.status(401).json({
        success: false,
        message: "Verify your email before creating an account.",
      });
    }

    if (await User.exists({ email: verification.email })) {
      await verification.deleteOne();
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const user = await User.create({
      username: verification.username,
      email: verification.email,
      password: await bcrypt.hash(password, 12),
      role: verification.role,
    });

    await verification.deleteOne();

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      token: createToken(user._id.toString()),
      user: getPublicUser(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    console.error("Signup completion error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to create your account. Please try again.",
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const requestedRole =
      req.body?.role === "restaurant" ? "restaurant" : "customer";

    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({
        success: false,
        message: "Please provide your email and password.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide your email and password.",
      });
    }

    const user = await User.findOne({ email: normalizedEmail }).select("+password");

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (user.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Please sign in through the admin access page.",
      });
    }

    if (user.role !== requestedRole) {
      return res.status(403).json({
        success: false,
        message:
          user.role === "restaurant"
            ? "This account is registered as a restaurant manager. Choose Restaurant Manager to continue."
            : "This account is registered as a customer. Choose Customer to continue.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token: createToken(user._id.toString()),
      user: getPublicUser(user),
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to log in. Please try again.",
    });
  }
});

router.post("/admin-login", async (req, res) => {
  try {
    const { password } = req.body || {};

    if (typeof password !== "string" || !password) {
      return res.status(400).json({
        success: false,
        message: "Enter the admin password.",
      });
    }

    const admin = await User.findOne({ role: "admin" }).select("+password");

    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin password.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Admin login successful.",
      token: createToken(admin._id.toString()),
      user: getPublicUser(admin),
    });
  } catch (error) {
    console.error("Admin login error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to sign in as admin.",
    });
  }
});

module.exports = router;