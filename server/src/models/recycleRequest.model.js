const mongoose = require('mongoose');

/**
 * One bulk footwear batch submitted by a recycler.
 * Masteradmin later splits `footwearCount` into `thriftCount` + `recycleCount`.
 */
const recycleRequestSchema = new mongoose.Schema(
  {
    recycler: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recycler',
      required: true,
      index: true,
    },
    recyclerName: {
      type: String,
      trim: true,
      default: '',
    },
    recyclerOrganization: {
      type: String,
      trim: true,
      default: '',
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    footwearCount: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: 'footwearCount must be a whole number',
      },
    },
    weightKg: {
      type: Number,
      required: true,
      min: 0.01,
    },
    date: {
      type: String, // YYYY-MM-DD, as chosen by the recycler
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    status: {
      type: String,
      enum: ['pending', 'updated'],
      default: 'pending',
      index: true,
    },
    thriftCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    recycleCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    adminNote: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    processedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

recycleRequestSchema.methods.toPublic = function toPublic() {
  return {
    id: String(this._id),
    recyclerId: String(this.recycler),
    recyclerName: this.recyclerName || '',
    recyclerOrganization: this.recyclerOrganization || '',
    name: this.name,
    imageUrl: this.imageUrl,
    footwearCount: this.footwearCount,
    weightKg: this.weightKg,
    date: this.date,
    status: this.status,
    thriftCount: this.thriftCount || 0,
    recycleCount: this.recycleCount || 0,
    adminNote: this.adminNote || '',
    processedAt: this.processedAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const RecycleRequest = mongoose.model('RecycleRequest', recycleRequestSchema);

module.exports = RecycleRequest;
