/**
 * Sell My Pair listing — luxury or everyday footwear submitted for review.
 */

const mongoose = require('mongoose');

const proofsSchema = new mongoose.Schema(
  {
    receipt: { type: String, default: null },
    purchaseEmail: { type: String, default: null },
    authenticityCard: { type: String, default: null },
    boxLabel: { type: String, default: null },
  },
  { _id: false }
);

const sellListingSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    articleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Article',
      required: true,
      index: true,
    },
    footwearType: {
      type: String,
      required: true,
      enum: ['luxury', 'everyday'],
      index: true,
    },
    originalRetailPrice: {
      type: Number,
      required: true,
      min: 1,
    },
    conditionGrade: {
      type: String,
      required: true,
      enum: ['brand_new_in_box', 'like_new', 'gently_used'],
    },
    proofs: {
      type: proofsSchema,
      required: true,
    },
    basePrice: {
      type: Number,
      required: true,
      min: 1,
    },
    auctionStartDate: {
      type: Date,
      required: true,
    },
    auctionEndDate: {
      type: Date,
      required: true,
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

sellListingSchema.index({ ownerId: 1, footwearType: 1, createdAt: -1 });
sellListingSchema.index({ status: 1, createdAt: -1 });

const SellListing = mongoose.model('SellListing', sellListingSchema);

module.exports = SellListing;
