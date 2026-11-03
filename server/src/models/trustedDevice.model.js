/**
 * Trusted device for skip-OTP re-login on the same phone+device
 * after the user has completed Google SMS consent + OTP once.
 */
const mongoose = require('mongoose');
const crypto = require('crypto');

const trustedDeviceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    mobile: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    deviceId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      index: true,
    },
    deviceInfo: {
      type: String,
      trim: true,
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 },
    },
  },
  { timestamps: true }
);

trustedDeviceSchema.index({ mobile: 1, deviceId: 1 }, { unique: true });

trustedDeviceSchema.statics.hashToken = (token) =>
  crypto.createHash('sha256').update(String(token)).digest('hex');

trustedDeviceSchema.statics.generateToken = () =>
  crypto.randomBytes(32).toString('hex');

module.exports = mongoose.model('TrustedDevice', trustedDeviceSchema);
