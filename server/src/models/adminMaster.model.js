/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : adminMaster.model.js
 * Description: Single master admin account for HTML dashboard (email + password)
 * ----------------------------------------------------------------------------
 */

const mongoose = require('mongoose');

const adminMasterSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    name: {
      type: String,
      trim: true,
      default: 'Darkworkstore',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: false,
      transform(_doc, ret) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

adminMasterSchema.index({ email: 1 }, { unique: true });

const AdminMaster = mongoose.model('AdminMaster', adminMasterSchema);

module.exports = AdminMaster;
