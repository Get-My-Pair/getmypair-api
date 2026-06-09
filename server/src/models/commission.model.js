/**
 * GMP commission ledger per successful payment.
 */
const mongoose = require('mongoose');

const commissionSchema = new mongoose.Schema(
  {
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
      unique: true,
      index: true,
    },
    serviceRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceRequest',
      required: true,
      index: true,
    },
    totalAmount: { type: Number, required: true, min: 0 },
    gmpAmount: { type: Number, required: true, min: 0 },
    partnerAmount: { type: Number, required: true, min: 0 },
    partnerType: {
      type: String,
      enum: ['cobbler', 'dark_store', 'gmp'],
      required: true,
    },
    partnerId: { type: String, trim: true, default: null },
    commissionPercent: { type: Number, required: true, min: 0, max: 100 },
    currency: { type: String, default: 'INR' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

commissionSchema.index({ createdAt: -1 });
commissionSchema.index({ partnerType: 1, partnerId: 1, createdAt: -1 });

const Commission = mongoose.model('Commission', commissionSchema);
module.exports = Commission;
