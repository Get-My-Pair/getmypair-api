/**
 * CareMyPair problem tiles managed by Masteradmin.
 * serviceType: repair | maintenance | wash
 * Shown in user app as selectable options (name, description, price).
 * progressSteps + estimateDays drive "Your Pair's Progress" (default 7 days / 7 steps).
 */
const mongoose = require('mongoose');

const SERVICE_TYPES = ['repair', 'maintenance', 'wash'];

const progressStepSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, required: true },
    subtitle: { type: String, trim: true, default: '' },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: false }
);

const careServiceProblemSchema = new mongoose.Schema(
  {
    serviceType: {
      type: String,
      enum: SERVICE_TYPES,
      required: true,
      index: true,
    },
    name: {
      type: String,
      trim: true,
      required: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    priceRupees: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    sortOrder: {
      type: Number,
      default: 0,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    /** Stable client key (optional); falls back to _id */
    code: {
      type: String,
      trim: true,
      default: '',
    },
    /**
     * Article category codes this problem applies to (e.g. boot, sandal).
     * Empty array = available for all categories.
     */
    categoryCodes: {
      type: [String],
      default: [],
      index: true,
    },
    /**
     * Estimated delivery window in days. User app advances 1 progress step per day.
     * Default 7.
     */
    estimateDays: {
      type: Number,
      min: 1,
      max: 60,
      default: 7,
    },
    /** Ordered labels shown on "Your Pair's Progress". Length usually matches estimateDays. */
    progressSteps: {
      type: [progressStepSchema],
      default: [],
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminMaster',
      default: null,
    },
  },
  { timestamps: true }
);

careServiceProblemSchema.index({ serviceType: 1, sortOrder: 1, createdAt: 1 });
careServiceProblemSchema.index({ serviceType: 1, categoryCodes: 1 });
careServiceProblemSchema.index({ serviceType: 1, code: 1 });

module.exports = mongoose.model('CareServiceProblem', careServiceProblemSchema);
module.exports.SERVICE_TYPES = SERVICE_TYPES;
