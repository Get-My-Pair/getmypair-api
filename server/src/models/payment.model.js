/**
 * Payment transactions – Zoho gateway, service request linkage, revenue split.
 */
const mongoose = require('mongoose');
const {
  paymentTransactionStatuses,
  providerTypes,
} = require('../constants/paymentWorkflow.constants');

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
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
    currency: { type: String, default: 'INR', trim: true },
    providerType: {
      type: String,
      enum: providerTypes,
      default: 'cobbler',
      index: true,
    },
    cobblerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    darkStoreId: { type: String, trim: true, default: null, index: true },
    status: {
      type: String,
      enum: paymentTransactionStatuses,
      default: 'PAYMENT_PENDING',
      index: true,
    },
    /** @deprecated Use status — kept for cobbler dashboard aggregates during migration */
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    zohoPaymentId: { type: String, trim: true, default: null, index: true },
    zohoOrderId: { type: String, trim: true, default: null },
    paymentLinkUrl: { type: String, trim: true, default: null },
    paymentMethod: { type: String, trim: true, default: null },
    gmpShare: { type: Number, default: 0, min: 0 },
    cobblerShare: { type: Number, default: 0, min: 0 },
    commissionPercent: { type: Number, default: 20, min: 0, max: 100 },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    paidAt: { type: Date, default: null },
    failedAt: { type: Date, default: null },
    failureReason: { type: String, trim: true, default: null },
    refundId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Refund',
      default: null,
    },
    /** Legacy Job ref — optional */
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', default: null },
  },
  { timestamps: true }
);

paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ cobblerId: 1, status: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ serviceRequestId: 1, status: 1 });

paymentSchema.pre('save', function syncLegacyPaymentStatus(next) {
  if (this.status === 'PAYMENT_SUCCESS') {
    this.paymentStatus = 'completed';
  } else if (this.status === 'PAYMENT_FAILED') {
    this.paymentStatus = 'failed';
  } else {
    this.paymentStatus = 'pending';
  }
  next();
});

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment;
