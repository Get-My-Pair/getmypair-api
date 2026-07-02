/**
 * Payment-specific audit trail (transactions, webhooks, settlements).
 */
const mongoose = require('mongoose');

const paymentAuditSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    resourceType: {
      type: String,
      enum: ['payment', 'settlement', 'commission', 'refund', 'webhook', 'service_request'],
      required: true,
      index: true,
    },
    resourceId: { type: String, trim: true, default: null, index: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ['success', 'failure', 'info'],
      default: 'info',
      index: true,
    },
    ipAddress: { type: String, trim: true, default: null },
    userAgent: { type: String, trim: true, default: null },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    errorMessage: { type: String, trim: true, default: null },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

paymentAuditSchema.index({ resourceType: 1, resourceId: 1, timestamp: -1 });
paymentAuditSchema.index({ timestamp: -1 });

paymentAuditSchema.statics.log = async function logEntry(data) {
  return this.create({
    action: data.action,
    resourceType: data.resourceType,
    resourceId: data.resourceId != null ? String(data.resourceId) : null,
    userId: data.userId || null,
    status: data.status || 'info',
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
    details: data.details || {},
    errorMessage: data.errorMessage,
    timestamp: data.timestamp || new Date(),
  });
};

const PaymentAudit = mongoose.model('PaymentAudit', paymentAuditSchema);
module.exports = PaymentAudit;
