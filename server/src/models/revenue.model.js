/**
 * Aggregated revenue snapshots (daily rollups for reporting).
 */
const mongoose = require('mongoose');

const revenueSchema = new mongoose.Schema(
  {
    period: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      required: true,
      index: true,
    },
    periodKey: { type: String, required: true, trim: true, index: true },
    providerType: {
      type: String,
      enum: ['cobbler', 'dark_store', 'gmp', 'all'],
      default: 'all',
      index: true,
    },
    beneficiaryId: { type: String, trim: true, default: null, index: true },
    totalCollected: { type: Number, default: 0, min: 0 },
    gmpRevenue: { type: Number, default: 0, min: 0 },
    partnerRevenue: { type: Number, default: 0, min: 0 },
    transactionCount: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'INR' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

revenueSchema.index({ period: 1, periodKey: 1, providerType: 1, beneficiaryId: 1 }, { unique: true });
revenueSchema.index({ periodKey: -1 });

const Revenue = mongoose.model('Revenue', revenueSchema);
module.exports = Revenue;
