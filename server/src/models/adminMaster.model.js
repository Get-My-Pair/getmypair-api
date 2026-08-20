/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : adminMaster.model.js
 * Description: Masteradmin + Darkworkstore + Delivery portal accounts (email + password)
 * ----------------------------------------------------------------------------
 */

const mongoose = require('mongoose');

const PORTALS = ['masteradmin', 'darkworkstore', 'delivery'];
const STATUSES = ['pending', 'verified', 'rejected'];
const REGISTERED_VIA = ['self', 'masteradmin'];

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
    portal: {
      type: String,
      enum: PORTALS,
      default: 'masteradmin',
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: STATUSES,
      default: 'pending',
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    storeName: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    city: {
      type: String,
      trim: true,
      default: '',
    },
    state: {
      type: String,
      trim: true,
      default: '',
    },
    pincode: {
      type: String,
      trim: true,
      default: '',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    registeredVia: {
      type: String,
      enum: REGISTERED_VIA,
      default: 'masteradmin',
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminMaster',
      default: null,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    // Darkworkstore: email OTP is required once; later logins use email + password only.
    emailVerifiedAt: {
      type: Date,
      default: null,
    },
    photoUrl: {
      type: String,
      trim: true,
      default: '',
    },
    aadhaarNumber: {
      type: String,
      trim: true,
      default: '',
    },
    lastLat: {
      type: Number,
      default: null,
    },
    lastLng: {
      type: Number,
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
adminMasterSchema.index({ portal: 1, status: 1, createdAt: -1 });

const AdminMaster = mongoose.model('AdminMaster', adminMasterSchema);

module.exports = AdminMaster;
module.exports.PORTALS = PORTALS;
module.exports.STATUSES = STATUSES;
