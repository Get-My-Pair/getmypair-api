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
    deliveryPartnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    deliveryProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DeliveryProfile',
      default: null,
    },
    pickupAssignedAt: {
      type: Date,
      default: null,
    },
    routingType: {
      type: String,
      enum: ['dark_store', 'direct'],
      default: 'dark_store',
      index: true,
    },
    darkStoreId: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },
    darkStoreName: {
      type: String,
      trim: true,
      default: null,
    },
    darkStoreAssignedAt: {
      type: Date,
      default: null,
    },
    trackingState: {
      type: String,
      trim: true,
      default: 'request_created',
      index: true,
    },
    trackingUpdatedAt: {
      type: Date,
      default: Date.now,
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
      // Module 4 status system (user-side)
      // pending -> pickup_assigned -> in_service -> completed (+ cancelled)
      enum: ['pending', 'pickup_assigned', 'in_service', 'completed', 'cancelled'],
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
serviceRequestSchema.index({ status: 1, deliveryPartnerId: 1, createdAt: -1 });
serviceRequestSchema.index({ darkStoreId: 1, status: 1, createdAt: -1 });

const ServiceRequest = mongoose.model('ServiceRequest', serviceRequestSchema);

module.exports = {
  ServiceRequest,
  serviceTypes,
  defaultEstimatedCostByServiceType,
};

