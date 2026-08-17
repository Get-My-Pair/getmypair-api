/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : otpLockout.model.js
 * Description: Tracks failed OTP verification attempts and temporary lockouts
 * ----------------------------------------------------------------------------
 */

const mongoose = require('mongoose');

const otpLockoutSchema = new mongoose.Schema(
  {
    identifier: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    failedAttempts: {
      type: Number,
      default: 0,
    },
    lockedUntil: {
      type: Date,
      default: null,
    },
    windowStartedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const OtpLockout = mongoose.model('OtpLockout', otpLockoutSchema);

module.exports = OtpLockout;
