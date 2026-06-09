/**
 * Zoho (and other gateway) webhook callback logs.
 */
const mongoose = require('mongoose');

const webhookLogSchema = new mongoose.Schema(
  {
    provider: { type: String, default: 'zoho', trim: true, index: true },
    eventType: { type: String, trim: true, default: null, index: true },
    orderId: { type: String, trim: true, default: null, index: true },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
      index: true,
    },
    signatureValid: { type: Boolean, default: null },
    processed: { type: Boolean, default: false, index: true },
    processingError: { type: String, trim: true, default: null },
    headers: { type: mongoose.Schema.Types.Mixed, default: {} },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    receivedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

webhookLogSchema.index({ provider: 1, receivedAt: -1 });
webhookLogSchema.index({ processed: 1, receivedAt: -1 });

const WebhookLog = mongoose.model('WebhookLog', webhookLogSchema);
module.exports = WebhookLog;
