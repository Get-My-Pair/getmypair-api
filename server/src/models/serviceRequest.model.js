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

const serviceStatuses = [
  'pending',
  'pickup_assigned',
  'in_service',
  'completed',
  'cancelled',
];

const serviceTrackingStates = [
  'request_created',
  'pickup_scheduled',
  'item_picked',
  'dark_store_received',
  'inspection_started',
  'repair_in_progress',
  'repair_completed',
  'dispatch_ready',
  'out_for_delivery',
  'delivered',
  'cancelled',
];

/** Default estimation cost (e.g. in smallest currency unit) per service type – for auto-fill. */
const defaultEstimatedCostByServiceType = {
  repair: 500,
  maintenance: 300,
  wash: 200,
  donate: 0,
  dispose: 0,
};

const lifecycleEventSchema = new mongoose.Schema(
  {
    state: { type: String, required: true, trim: true },
    status: { type: String, enum: serviceStatuses, default: null },
    actorType: {
      type: String,
      enum: ['system', 'customer', 'delivery', 'dark_store', 'cobbler', 'admin'],
      default: 'system',
    },
    actorId: { type: String, default: null },
    note: { type: String, trim: true, default: null },
    media: {
      photos: { type: [String], default: [] },
      videos: { type: [String], default: [] },
    },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

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
    /** Customer problem / service notes (matches app “describe the problem” field). */
    problemDescription: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },
    /** How the customer will hand over footwear: home pickup vs drop at cobbler. */
    pickupMode: {
      type: String,
      enum: ['home_pickup', 'cobbler_nearby'],
      default: 'home_pickup',
    },
    /** Requested pickup window start (from app date + time slot). */
    requestedPickupAt: {
      type: Date,
      default: null,
    },
    /** Maintenance subscription selection from app (optional). */
    maintenancePlanId: {
      type: String,
      trim: true,
      maxlength: 32,
      default: null,
    },
    maintenancePlanLabel: {
      type: String,
      trim: true,
      maxlength: 120,
      default: null,
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
    cobblerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    cobblerProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CobblerProfile',
      default: null,
    },
    cobblerAssignedAt: {
      type: Date,
      default: null,
    },
    /**
     * Cobblers who rejected/declined this request (so they don't see it again).
     * This does NOT cancel the user's request; it stays pending for other cobblers.
     */
    cobblerDeclinedBy: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      default: [],
      index: true,
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
      enum: serviceStatuses,
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
    /**
     * After admin sets actualCost, user must accept/reject before workflow advances.
     * null = not applicable (no actual cost yet, or cleared).
     */
    /** pending | accepted | rejected — null when no actual cost or cleared */
    actualCostUserDecision: {
      type: String,
      default: null,
      trim: true,
    },
    actualCostAcceptedAt: {
      type: Date,
      default: null,
    },
    lifecycleEvents: {
      type: [lifecycleEventSchema],
      default: [],
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
serviceRequestSchema.index({ cobblerId: 1, status: 1, createdAt: -1 });
serviceRequestSchema.index({ status: 1, cobblerId: 1, cobblerDeclinedBy: 1, createdAt: -1 });

const ServiceRequest = mongoose.model('ServiceRequest', serviceRequestSchema);

module.exports = {
  ServiceRequest,
  serviceTypes,
  serviceStatuses,
  serviceTrackingStates,
  defaultEstimatedCostByServiceType,
};

