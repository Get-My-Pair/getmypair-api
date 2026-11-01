/**
 * Hub drop-off locations managed by Masteradmin (multiple allowed).
 * Delivery members use these for Hub direction / maps.
 */
const mongoose = require('mongoose');

const hubSettingsSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: 'GetMyPair Hub',
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
    lat: {
      type: Number,
      default: null,
    },
    lng: {
      type: Number,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminMaster',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('HubSettings', hubSettingsSchema);
