/**
 * Invoice records (future GST support).
 */
const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
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
    invoiceNumber: { type: String, required: true, unique: true, trim: true },
    subtotal: { type: Number, required: true, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    gstin: { type: String, trim: true, default: null },
    lineItems: { type: [mongoose.Schema.Types.Mixed], default: [] },
    issuedAt: { type: Date, default: Date.now },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

invoiceSchema.index({ userId: 1, issuedAt: -1 });

const Invoice = mongoose.model('Invoice', invoiceSchema);
module.exports = Invoice;
