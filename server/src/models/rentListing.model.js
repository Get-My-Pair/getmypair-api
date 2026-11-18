/**
 * Rent My Pair listing — footwear a user offers for rent, pending masteradmin approval.
 */

const mongoose = require('mongoose');

const RENT_DURATIONS = ['week', 'month', '3month', '6month', '1year'];

const rentListingSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      maxlength: 80,
      default: 'Footwear',
    },
    imageUrl: {
      type: String,
      required: true,
      trim: true,
    },
    duration: {
      type: String,
      required: true,
      enum: RENT_DURATIONS,
    },
    price: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    rejectReason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminMaster',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

rentListingSchema.index({ ownerId: 1, createdAt: -1 });
rentListingSchema.index({ status: 1, createdAt: -1 });

const RentListing = mongoose.model('RentListing', rentListingSchema);

module.exports = RentListing;
module.exports.RENT_DURATIONS = RENT_DURATIONS;
