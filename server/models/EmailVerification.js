const mongoose = require("mongoose");

const emailVerificationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
    trim: true,
    maxlength: 16,
  },
  role: {
    type: String,
    enum: ["customer", "restaurant"],
    required: true,
  },
  codeHash: {
    type: String,
    required: true,
  },
  attempts: {
    type: Number,
    default: 0,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 },
  },
  resendAfter: {
    type: Date,
    required: true,
  },
  verifiedAt: {
    type: Date,
    default: null,
  },
  signupTokenHash: {
    type: String,
    default: null,
  },
});

module.exports = mongoose.model("EmailVerification", emailVerificationSchema);