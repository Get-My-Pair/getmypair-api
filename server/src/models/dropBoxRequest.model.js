const mongoose = require('mongoose');

/**
 * One public "Drop Box" submission: a person uploads a photo of their pair with a name
 * and phone number, then (on the thank-you page) shares where they are.
 *
 * `locationTokenHash` is the hash of a secret returned only when the request is created.
 * The submitter's browser sends it back to attach a location, so nobody else can
 * overwrite a request's location just by guessing its id.
 */
const dropBoxRequestSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    countryCode: {
      type: String, // e.g. "+91"
      required: true,
      match: /^\+\d{1,7}$/,
    },
    phoneNumber: {
      type: String, // national digits only, e.g. "9876543210"
      required: true,
      match: /^\d{4,14}$/,
    },
    phone: {
      type: String, // countryCode + phoneNumber, e.g. "+919876543210"
      required: true,
      index: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    locationStatus: {
      type: String,
      enum: ['pending', 'shared', 'denied'],
      default: 'pending',
      index: true,
    },
    location: {
      lat: { type: Number, min: -90, max: 90 },
      lng: { type: Number, min: -180, max: 180 },
      accuracy: { type: Number, min: 0 }, // metres, as reported by the device
      address: { type: String, trim: true, maxlength: 400 },
      capturedAt: { type: Date },
    },
    locationTokenHash: {
      type: String,
      required: true,
      select: false,
    },
  },
  { timestamps: true }
);

dropBoxRequestSchema.index({ createdAt: -1 });

dropBoxRequestSchema.methods.hasLocation = function hasLocation() {
  return (
    this.locationStatus === 'shared' &&
    typeof this.location?.lat === 'number' &&
    typeof this.location?.lng === 'number'
  );
};

dropBoxRequestSchema.methods.locationPublic = function locationPublic() {
  if (!this.hasLocation()) return null;
  return {
    lat: this.location.lat,
    lng: this.location.lng,
    accuracy: this.location.accuracy ?? null,
    address: this.location.address || '',
    capturedAt: this.location.capturedAt || null,
  };
};

/** Full record for the masteradmin table (includes the photo). */
dropBoxRequestSchema.methods.toPublic = function toPublic() {
  return {
    id: String(this._id),
    name: this.name,
    countryCode: this.countryCode,
    phoneNumber: this.phoneNumber,
    phone: this.phone,
    imageUrl: this.imageUrl,
    locationStatus: this.locationStatus,
    location: this.locationPublic(),
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const DropBoxRequest = mongoose.model('DropBoxRequest', dropBoxRequestSchema);

module.exports = DropBoxRequest;
