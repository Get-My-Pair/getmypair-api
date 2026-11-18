/**
 * Paid request to rent an approved Rent My Pair listing.
 * Shown to the listing owner and to masteradmin.
 */

const mongoose = require('mongoose');

const rentRequestSchema = new mongoose.Schema(
  {
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RentListing',
      required: true,
      index: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    renterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    duration: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 1,
    },
    paymentStatus: {
      type: String,
      enum: ['paid'],
      default: 'paid',
    },
    paidAmount: {
      type: Number,
      required: true,
      min: 1,
    },
    paidAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['requested'],
      default: 'requested',
      index: true,
    },
  },
  { timestamps: true }
);

rentRequestSchema.index({ ownerId: 1, createdAt: -1 });
rentRequestSchema.index({ renterId: 1, listingId: 1 });

const RentRequest = mongoose.model('RentRequest', rentRequestSchema);

module.exports = RentRequest;
