/**
 * Donate My Pair — user uploads a photo and submits a donation request.
 */

const mongoose = require('mongoose');

const donateRequestSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    imageUrl: {
      type: String,
      required: true,
      trim: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
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

donateRequestSchema.index({ ownerId: 1, createdAt: -1 });
donateRequestSchema.index({ status: 1, createdAt: -1 });

const DonateRequest = mongoose.model('DonateRequest', donateRequestSchema);

module.exports = DonateRequest;
