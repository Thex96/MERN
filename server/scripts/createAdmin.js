require("dotenv").config();

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/User");

async function createAdmin() {
  const username = process.env.ADMIN_USERNAME?.trim();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const passwordRule = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,72}$/;

  if (!process.env.MONGO_URI || !username || !email || !password) {
    throw new Error("Set MONGO_URI, ADMIN_USERNAME, ADMIN_EMAIL, and ADMIN_PASSWORD in server/.env.");
  }
  if (username.length > 16 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !passwordRule.test(password)) {
    throw new Error("Check the admin username, email, and password requirements.");
  }

  await mongoose.connect(process.env.MONGO_URI);
  if (await User.exists({ email })) throw new Error("An account already uses that email address.");
  await User.create({ username, email, password: await bcrypt.hash(password, 12), role: "admin" });
  console.log("Administrator account created. Remove ADMIN_PASSWORD from server/.env now.");
}

createAdmin()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  });
