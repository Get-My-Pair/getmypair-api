/**
 * Settlement / payout records for cobblers and dark stores.
 */
const mongoose = require('mongoose');
const { settlementStatuses } = require('../constants/paymentWorkflow.constants');

const settlementSchema = new mongoose.Schema(
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
    beneficiaryType: {
      type: String,
      enum: ['cobbler', 'dark_store', 'gmp'],
      required: true,
      index: true,
    },
    beneficiaryId: { type: String, required: true, trim: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: settlementStatuses,
      default: 'pending',
      index: true,
    },
    scheduledAt: { type: Date, default: null },
    processedAt: { type: Date, default: null },
    externalPayoutRef: { type: String, trim: true, default: null },
    failureReason: { type: String, trim: true, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

settlementSchema.index({ beneficiaryId: 1, status: 1, createdAt: -1 });
settlementSchema.index({ status: 1, scheduledAt: 1 });

const Settlement = mongoose.model('Settlement', settlementSchema);
module.exports = Settlement;
