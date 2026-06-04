/**
 * Refund records linked to payments.
 */
const mongoose = require('mongoose');
const { refundStatuses } = require('../constants/paymentWorkflow.constants');

const refundSchema = new mongoose.Schema(
  {
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
      index: true,
    },
    serviceRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceRequest',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    reason: { type: String, trim: true, default: null },
    status: {
      type: String,
      enum: refundStatuses,
      default: 'requested',
      index: true,
    },
    zohoRefundId: { type: String, trim: true, default: null },
    processedAt: { type: Date, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

refundSchema.index({ userId: 1, createdAt: -1 });
refundSchema.index({ status: 1, createdAt: -1 });

const Refund = mongoose.model('Refund', refundSchema);
module.exports = Refund;
