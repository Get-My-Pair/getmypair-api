/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : service.controller.js
 * Description: Module 4 – Service Request create
 * ----------------------------------------------------------------------------
 */

const mongoose = require('mongoose');
const {
  ServiceRequest,
  defaultEstimatedCostByServiceType,
  serviceStatuses,
  serviceTrackingStates,
} = require('../models/serviceRequest.model');
const Article = require('../models/article.model');
const UserProfile = require('../models/userProfile.model');
const DeliveryProfile = require('../models/deliveryProfile.model');
const CobblerProfile = require('../models/cobblerProfile.model');
const { success, error: errorResponse, notFound } = require('../utils/response');
const logger = require('../utils/logger');

const trackingStateOrder = serviceTrackingStates.reduce((acc, state, idx) => {
  acc[state] = idx;
  return acc;
}, {});

const stateToStatusMap = {
  request_created: 'pending',
  pickup_scheduled: 'pickup_assigned',
  item_picked: 'pickup_assigned',
  dark_store_received: 'in_service',
  inspection_started: 'in_service',
  repair_in_progress: 'in_service',
  repair_completed: 'in_service',
  dispatch_ready: 'in_service',
  out_for_delivery: 'in_service',
  delivered: 'completed',
  cancelled: 'cancelled',
};

/**
 * Create Service Request
 * POST /api/service/create
 * Body: { articleId, serviceType, addressId, photos?, videos?, estimatedCost?, actualCost? }
 * estimatedCost: optional; if omitted, auto-filled from service-type default.
 * actualCost: optional; typically set by cobbler later.
 */
const createServiceRequest = async (req, res) => {
  try {
    const userId = req.user._id;
    const { articleId, serviceType, addressId, photos, videos, estimatedCost, actualCost } = req.body;

    // Verify article belongs to current user
    const article = await Article.findOne({ _id: articleId, ownerId: userId }).lean();
    if (!article) {
      return notFound(res, 'Article not found');
    }

    // Verify address exists in user profile (addresses are embedded sub-docs)
    const profile = await UserProfile.findOne({ userId }).lean();
    if (!profile) {
      return notFound(res, 'User profile not found');
    }

    const addrIdStr = String(addressId);
    const hasAddress = Array.isArray(profile.addresses) && profile.addresses.some((a) => String(a._id) === addrIdStr);
    if (!hasAddress) {
      return errorResponse(res, 'Address not found for this user', 400);
    }

    // Auto-fill estimatedCost from service-type default if not provided
    const estimated =
      estimatedCost != null && Number(estimatedCost) >= 0
        ? Number(estimatedCost)
        : (defaultEstimatedCostByServiceType[serviceType] ?? null);

    const doc = await ServiceRequest.create({
      userId,
      articleId: new mongoose.Types.ObjectId(articleId),
      serviceType,
      addressId: new mongoose.Types.ObjectId(addressId),
      photos: Array.isArray(photos) ? photos : [],
      videos: Array.isArray(videos) ? videos : [],
      status: 'pending',
      estimatedCost: estimated,
      actualCost: actualCost != null && Number(actualCost) >= 0 ? Number(actualCost) : null,
      routingType: 'dark_store',
      trackingState: 'request_created',
      trackingUpdatedAt: new Date(),
      lifecycleEvents: [
        {
          state: 'request_created',
          status: 'pending',
          actorType: 'customer',
          actorId: String(userId),
          note: 'Service request created',
          timestamp: new Date(),
        },
      ],
    });

    logger.info(`Service request created: ${doc._id} user=${userId} article=${articleId} type=${serviceType}`);
    return success(res, 'Service request created successfully', { request: doc }, 201);
  } catch (err) {
    logger.error(`Create service request error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

/**
 * Get service request details
 * GET /api/service/:requestId
 */
const getServiceRequestDetails = async (req, res) => {
  try {
    const { requestId } = req.params;
    const query = { _id: requestId };

    const role = String(req.user?.role?.name || req.user?.role || '').toUpperCase();
    if (role === 'USER') {
      query.userId = req.user._id;
    }

    const request = await ServiceRequest.findOne(query).lean();
    if (!request) {
      return notFound(res, 'Service request not found');
    }

    return success(res, 'Service request details retrieved successfully', { request });
  } catch (err) {
    logger.error(`Get service request details error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

/**
 * Get my service requests
 * GET /api/service/my
 */
const getMyServiceRequests = async (req, res) => {
  try {
    const userId = req.user._id;
    const requests = await ServiceRequest.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    return success(res, 'Service requests retrieved successfully', { requests });
  } catch (err) {
    logger.error(`Get my service requests error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

/**
 * Get default estimation cost per service type (for auto-fill on frontend).
 * GET /api/service/estimation-defaults
 */
const getEstimationDefaults = async (req, res) => {
  try {
    return success(res, 'Estimation defaults by service type', {
      estimationDefaults: defaultEstimatedCostByServiceType,
    });
  } catch (err) {
    logger.error(`Get estimation defaults error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

/**
 * Assign delivery partner for pickup
 * POST /api/service/assign-delivery
 * Body: { requestId, deliveryPartnerId? }
 *
 * If deliveryPartnerId is omitted, system auto-picks first verified delivery partner.
 */
const assignDeliveryPartner = async (req, res) => {
  try {
    const { requestId, deliveryPartnerId } = req.body;

    const request = await ServiceRequest.findById(requestId);
    if (!request) {
      return notFound(res, 'Service request not found');
    }

    if (request.status === 'cancelled' || request.status === 'completed') {
      return errorResponse(res, `Cannot assign delivery for ${request.status} request`, 400);
    }

    let partnerProfile = null;
    if (deliveryPartnerId) {
      partnerProfile = await DeliveryProfile.findOne({
        userId: deliveryPartnerId,
        verificationStatus: 'verified',
      }).lean();
      if (!partnerProfile) {
        return notFound(res, 'Verified delivery partner not found');
      }
    } else {
      partnerProfile = await DeliveryProfile.findOne({ verificationStatus: 'verified' })
        .sort({ updatedAt: -1 })
        .lean();
      if (!partnerProfile) {
        return errorResponse(res, 'No verified delivery partner available', 404);
      }
    }

    request.deliveryPartnerId = partnerProfile.userId;
    request.deliveryProfileId = partnerProfile._id;
    request.pickupAssignedAt = new Date();
    request.status = 'pickup_assigned';
    request.trackingState = 'pickup_assigned';
    request.trackingUpdatedAt = new Date();

    await request.save();

    logger.info(`Delivery assigned for request=${requestId} partner=${partnerProfile.userId}`);
    return success(res, 'Delivery partner assigned successfully', {
      request: request.toObject(),
      deliveryPartner: {
        profileId: partnerProfile._id,
        userId: partnerProfile.userId,
        name: partnerProfile.name,
        phone: partnerProfile.phone,
        vehicleType: partnerProfile.vehicleType,
        vehicleNumber: partnerProfile.vehicleNumber,
      },
    });
  } catch (err) {
    logger.error(`Assign delivery partner error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

/**
 * Assign dark store to service request
 * POST /api/service/assign-darkstore
 * Body: { requestId, darkStoreId, darkStoreName?, routingType? }
 */
const assignDarkStore = async (req, res) => {
  try {
    const { requestId, darkStoreId, darkStoreName, routingType } = req.body;

    const request = await ServiceRequest.findById(requestId);
    if (!request) {
      return notFound(res, 'Service request not found');
    }
    if (request.status === 'cancelled' || request.status === 'completed') {
      return errorResponse(res, `Cannot assign dark store for ${request.status} request`, 400);
    }

    request.darkStoreId = String(darkStoreId).trim();
    request.darkStoreName = darkStoreName ? String(darkStoreName).trim() : request.darkStoreName;
    request.routingType = routingType || 'dark_store';
    request.darkStoreAssignedAt = new Date();
    request.trackingState = 'dark_store_assigned';
    request.trackingUpdatedAt = new Date();

    await request.save();

    logger.info(`Dark store assigned for request=${requestId} darkStore=${request.darkStoreId}`);
    return success(res, 'Dark store assigned successfully', { request: request.toObject() });
  } catch (err) {
    logger.error(`Assign dark store error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

/**
 * Service status update API
 * POST /api/service/update-status
 */
const updateServiceStatus = async (req, res) => {
  try {
    const {
      requestId,
      status,
      state,
      note,
      cobblerId,
      photos,
      videos,
      actorType,
    } = req.body;

    const request = await ServiceRequest.findById(requestId);
    if (!request) {
      return notFound(res, 'Service request not found');
    }

    if (request.status === 'completed' || request.status === 'cancelled') {
      return errorResponse(res, `Cannot update ${request.status} request`, 400);
    }

    if (cobblerId) {
      const cobblerProfile = await CobblerProfile.findOne({
        userId: cobblerId,
        verificationStatus: 'verified',
      }).lean();
      if (!cobblerProfile) {
        return notFound(res, 'Verified cobbler not found');
      }
      request.cobblerId = cobblerProfile.userId;
      request.cobblerProfileId = cobblerProfile._id;
      if (!request.cobblerAssignedAt) {
        request.cobblerAssignedAt = new Date();
      }
    }

    const nextState = state || request.trackingState || 'request_created';
    if (!serviceTrackingStates.includes(nextState)) {
      return errorResponse(res, `state must be one of: ${serviceTrackingStates.join(', ')}`, 400);
    }

    const currentState = request.trackingState || 'request_created';
    if (nextState !== currentState) {
      const currentOrder = trackingStateOrder[currentState] ?? -1;
      const nextOrder = trackingStateOrder[nextState] ?? -1;
      if (nextOrder < currentOrder) {
        return errorResponse(res, 'Invalid state transition. Cannot move lifecycle backward.', 400);
      }
    }

    const inferredStatus = stateToStatusMap[nextState] || request.status;
    const nextStatus = status || inferredStatus;
    if (!serviceStatuses.includes(nextStatus)) {
      return errorResponse(res, `status must be one of: ${serviceStatuses.join(', ')}`, 400);
    }

    if (['inspection_started', 'repair_in_progress', 'repair_completed'].includes(nextState) && !request.cobblerId) {
      return errorResponse(res, 'Cobbler must be assigned before moving to inspection or repair states', 400);
    }

    if (nextState === 'dark_store_received' && !request.darkStoreId) {
      return errorResponse(res, 'Dark store must be assigned before dark_store_received state', 400);
    }

    const eventActorType = actorType || (request.cobblerId ? 'cobbler' : 'system');

    request.status = nextStatus;
    request.trackingState = nextState;
    request.trackingUpdatedAt = new Date();
    request.lifecycleEvents = Array.isArray(request.lifecycleEvents) ? request.lifecycleEvents : [];
    request.lifecycleEvents.push({
      state: nextState,
      status: nextStatus,
      actorType: eventActorType,
      actorId: String(req.user._id),
      note: note ? String(note).trim() : null,
      media: {
        photos: Array.isArray(photos) ? photos : [],
        videos: Array.isArray(videos) ? videos : [],
      },
      timestamp: new Date(),
    });

    await request.save();

    return success(res, 'Service status updated successfully', { request: request.toObject() });
  } catch (err) {
    logger.error(`Update service status error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

/**
 * Cancel service request
 * PUT /api/service/cancel/:requestId
 */
const cancelServiceRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const role = String(req.user?.role?.name || req.user?.role || '').toUpperCase();
    const query = role === 'USER' ? { _id: requestId, userId: req.user._id } : { _id: requestId };

    const request = await ServiceRequest.findOne(query);
    if (!request) {
      return notFound(res, 'Service request not found');
    }
    if (request.status === 'completed') {
      return errorResponse(res, 'Completed request cannot be cancelled', 400);
    }
    if (request.status === 'cancelled') {
      return success(res, 'Service request already cancelled', { request: request.toObject() });
    }

    request.status = 'cancelled';
    request.trackingState = 'cancelled';
    request.trackingUpdatedAt = new Date();
    request.lifecycleEvents = Array.isArray(request.lifecycleEvents) ? request.lifecycleEvents : [];
    request.lifecycleEvents.push({
      state: 'cancelled',
      status: 'cancelled',
      actorType: role === 'USER' ? 'customer' : 'system',
      actorId: String(req.user._id),
      note: 'Service request cancelled',
      media: { photos: [], videos: [] },
      timestamp: new Date(),
    });
    await request.save();

    return success(res, 'Service request cancelled successfully', { request: request.toObject() });
  } catch (err) {
    logger.error(`Cancel service request error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

/**
 * Upload service request media evidence
 * POST /api/service/upload-media
 */
const uploadServiceMedia = async (req, res) => {
  try {
    const { requestId, photos, videos, note, state, actorType } = req.body;
    const request = await ServiceRequest.findById(requestId);
    if (!request) {
      return notFound(res, 'Service request not found');
    }

    const photoList = Array.isArray(photos) ? photos : [];
    const videoList = Array.isArray(videos) ? videos : [];
    request.photos = [...(request.photos || []), ...photoList];
    request.videos = [...(request.videos || []), ...videoList];

    request.lifecycleEvents = Array.isArray(request.lifecycleEvents) ? request.lifecycleEvents : [];
    request.lifecycleEvents.push({
      state: state || request.trackingState || 'media_uploaded',
      status: request.status,
      actorType: actorType || 'system',
      actorId: String(req.user._id),
      note: note || 'Media evidence uploaded',
      media: { photos: photoList, videos: videoList },
      timestamp: new Date(),
    });
    await request.save();

    return success(res, 'Service media uploaded successfully', { request: request.toObject() });
  } catch (err) {
    logger.error(`Upload service media error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

module.exports = {
  createServiceRequest,
  getMyServiceRequests,
  getServiceRequestDetails,
  getEstimationDefaults,
  assignDeliveryPartner,
  assignDarkStore,
  updateServiceStatus,
  cancelServiceRequest,
  uploadServiceMedia,
};

