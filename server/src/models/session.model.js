/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : session.model.js
 * Description: Session schema – user, refreshToken, device, IP, expiry
 * ----------------------------------------------------------------------------
 * Developer  : C Ranjith Kumar
 * LinkedIn         : https://www.linkedin.com/in/coding-ranjith/
 * Personal GitHub  : https://github.com/CodingRanjith
 * Project GitHub   : https://github.com/Ranjithgmp
 * Personal Email   : ranjith.c96me@gmail.com
 * Project Email    : ranjith.kumar@getmypair.com
 * ----------------------------------------------------------------------------
 * Last modified : 2025-03-03
 * ----------------------------------------------------------------------------
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    accessToken: {
      type: String,
      required: true,
    },
    refreshToken: {
      type: String,
      required: true,
      index: true,
    },
    deviceInfo: {
      type: String,
      trim: true,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // TTL index
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
sessionSchema.index({ userId: 1, isActive: 1 });
sessionSchema.index({ refreshToken: 1 });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Hash tokens before saving
sessionSchema.pre('save', async function (next) {
  if (this.isModified('accessToken')) {
    this.accessToken = crypto
      .createHash('sha256')
      .update(this.accessToken)
      .digest('hex');
  }
  if (this.isModified('refreshToken')) {
    this.refreshToken = crypto
      .createHash('sha256')
      .update(this.refreshToken)
      .digest('hex');
  }
  next();
});

// Method to update last activity
sessionSchema.methods.updateActivity = async function () {
  this.lastActivity = Date.now();
  return this.save();
};

// Method to revoke session
sessionSchema.methods.revoke = async function () {
  this.isActive = false;
  return this.save();
};

// Static method to find session by refresh token hash
sessionSchema.statics.findByRefreshToken = async function (refreshToken) {
  const tokenHash = crypto
    .createHash('sha256')
    .update(refreshToken)
    .digest('hex');
  return this.findOne({ refreshToken: tokenHash, isActive: true });
};

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;
