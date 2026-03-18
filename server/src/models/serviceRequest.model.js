/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : serviceRequest.model.js
 * Description: Service Request – userId, articleId, serviceType, addressId, status, createdAt
 * ----------------------------------------------------------------------------
 */

const mongoose = require('mongoose');

// Central service types schema/enum so it can be reused in validation and Swagger.
const serviceTypes = [
  'repair',
  'maintenance',
  'wash',
  'donate',
  'dispose',
];

/** Default estimation cost (e.g. in smallest currency unit) per service type – for auto-fill. */
const defaultEstimatedCostByServiceType = {
  repair: 500,
  maintenance: 300,
  wash: 200,
  donate: 0,
  dispose: 0,
};

const serviceRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    articleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Article',
      required: true,
      index: true,
    },
    serviceType: {
      type: String,
      required: true,
      enum: serviceTypes,
      trim: true,
    },
    addressId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    photos: {
      type: [String],
      default: [],
    },
    videos: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    /** Estimation cost (e.g. cents) – can be auto-filled from service type default. */
    estimatedCost: {
      type: Number,
      default: null,
      min: 0,
    },
    /** Actual cost set by cobbler after service. */
    actualCost: {
      type: Number,
      default: null,
      min: 0,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
    toJSON: { virtuals: false },
    toObject: { virtuals: false },
  }
);

serviceRequestSchema.index({ userId: 1, createdAt: -1 });
serviceRequestSchema.index({ articleId: 1, createdAt: -1 });

const ServiceRequest = mongoose.model('ServiceRequest', serviceRequestSchema);

module.exports = {
  ServiceRequest,
  serviceTypes,
  defaultEstimatedCostByServiceType,
};

