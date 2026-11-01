/**
 * Singleton hub (drop-off) address managed by Masteradmin.
 * Delivery members use this for Hub direction / maps.
 */
const mongoose = require('mongoose');

const HUB_KEY = 'hub';

const hubSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: HUB_KEY,
      immutable: true,
    },
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
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminMaster',
      default: null,
    },
  },
  { timestamps: true }
);

hubSettingsSchema.statics.HUB_KEY = HUB_KEY;

hubSettingsSchema.statics.getHub = async function getHub() {
  let doc = await this.findOne({ key: HUB_KEY }).lean();
  if (!doc) {
    doc = (
      await this.create({
        key: HUB_KEY,
        name: 'GetMyPair Hub',
      })
    ).toObject();
  }
  return doc;
};

module.exports = mongoose.model('HubSettings', hubSettingsSchema);
