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
const { uploadToCloudinary } = require('../config/cloudinary');
const { success, error: errorResponse, notFound } = require('../utils/response');
const logger = require('../utils/logger');

const trackingStateOrder = serviceTrackingStates.reduce((acc, state, idx) => {
  acc[state] = idx;
  return acc;
}, {});

const isAwaitingUserActualCost = (reqDoc) =>
  reqDoc.actualCost != null && reqDoc.actualCostUserDecision === 'pending';

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
 * Body: { articleId, serviceType, addressId, photos?, videos?, estimatedCost?, actualCost?,
 *   problemDescription?, pickupMode?, requestedPickupAt?, maintenancePlanId?, maintenancePlanLabel? }
 * estimatedCost: optional; if omitted, auto-filled from service-type default.
 * actualCost: optional; typically set by cobbler later.
 */
const createServiceRequest = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      articleId,
      serviceType,
      addressId,
      photos,
      videos,
      estimatedCost,
      actualCost,
      problemDescription,
      pickupMode,
      requestedPickupAt,
      maintenancePlanId,
      maintenancePlanLabel,
    } = req.body;

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

    const pickupModeNorm =
      pickupMode === 'cobbler_nearby' ? 'cobbler_nearby' : 'home_pickup';

    let requestedAt = null;
    if (requestedPickupAt != null && String(requestedPickupAt).trim() !== '') {
      const d = new Date(requestedPickupAt);
      if (!Number.isNaN(d.getTime())) {
        requestedAt = d;
      }
    }

    const problemNorm =
      problemDescription != null && String(problemDescription).trim() !== ''
        ? String(problemDescription).trim()
        : null;

    const doc = await ServiceRequest.create({
      userId,
      articleId: new mongoose.Types.ObjectId(articleId),
      serviceType,
      addressId: new mongoose.Types.ObjectId(addressId),
      photos: Array.isArray(photos) ? photos : [],
      videos: Array.isArray(videos) ? videos : [],
      problemDescription: problemNorm,
      pickupMode: pickupModeNorm,
      requestedPickupAt: requestedAt,
      maintenancePlanId:
        maintenancePlanId != null && String(maintenancePlanId).trim() !== ''
          ? String(maintenancePlanId).trim()
          : null,
      maintenancePlanLabel:
        maintenancePlanLabel != null && String(maintenancePlanLabel).trim() !== ''
          ? String(maintenancePlanLabel).trim()
          : null,
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

    const request = await ServiceRequest.findOne(query)
      .populate('articleId', 'brand model category color purchaseYear condition images')
      .populate('userId', 'name mobile')
      .lean();
    if (!request) {
      return notFound(res, 'Service request not found');
    }

    // Resolve pickup address from user profile (addresses are embedded)
    let pickupAddress = null;
    try {
      const profile = await UserProfile.findOne({ userId: request.userId?._id || request.userId })
        .select('addresses')
        .lean();
      const addrIdStr = String(request.addressId);
      pickupAddress =
        profile?.addresses?.find((a) => String(a._id) === addrIdStr) || null;
    } catch (_) {
      pickupAddress = null;
    }

    return success(res, 'Service request details retrieved successfully', {
      request,
      article: request.articleId || null,
      user: request.userId || null,
      pickupAddress,
      media: {
        photos: Array.isArray(request.photos) ? request.photos : [],
        videos: Array.isArray(request.videos) ? request.videos : [],
      },
    });
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

    if (isAwaitingUserActualCost(request)) {
      return errorResponse(
        res,
        'User must accept or reject the final service cost before delivery can be assigned.',
        400
      );
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

    if (isAwaitingUserActualCost(request)) {
      return errorResponse(
        res,
        'User must accept or reject the final service cost before dark store can be assigned.',
        400
      );
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

    const currentStateForGuard = request.trackingState || 'request_created';
    const nextStateForGuard = state || currentStateForGuard;
    if (
      nextStateForGuard !== currentStateForGuard &&
      isAwaitingUserActualCost(request)
    ) {
      return errorResponse(
        res,
        'User must accept or reject the final service cost before workflow can be updated.',
        400
      );
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
 * User accepts or rejects admin-set final actual cost.
 * POST /api/service/respond-actual-cost
 * Body: { requestId, decision: 'accept' | 'reject' }
 */
const respondToActualCost = async (req, res) => {
  try {
    const userId = req.user._id;
    const { requestId, decision } = req.body;

    const request = await ServiceRequest.findOne({
      _id: requestId,
      userId,
    });
    if (!request) {
      return notFound(res, 'Service request not found');
    }
    if (request.status === 'completed' || request.status === 'cancelled') {
      return errorResponse(res, `Cannot respond on a ${request.status} request`, 400);
    }
    if (request.actualCost == null) {
      return errorResponse(res, 'No final service cost has been set yet', 400);
    }

    const dec = String(decision || '')
      .trim()
      .toLowerCase();
    if (!['accept', 'reject'].includes(dec)) {
      return errorResponse(res, 'decision must be accept or reject', 400);
    }

    if (request.actualCostUserDecision === 'accepted' && dec === 'accept') {
      return success(res, 'Final cost already accepted', { request: request.toObject() });
    }
    if (request.actualCostUserDecision === 'rejected') {
      return errorResponse(res, 'This request was rejected for the final cost', 400);
    }
    if (request.actualCostUserDecision !== 'pending') {
      return errorResponse(
        res,
        'There is no pending final cost approval for this request',
        400
      );
    }

    request.lifecycleEvents = Array.isArray(request.lifecycleEvents) ? request.lifecycleEvents : [];
    request.trackingUpdatedAt = new Date();

    if (dec === 'reject') {
      request.status = 'cancelled';
      request.trackingState = 'cancelled';
      request.actualCostUserDecision = 'rejected';
      request.actualCostAcceptedAt = null;
      request.lifecycleEvents.push({
        state: 'cancelled',
        status: 'cancelled',
        actorType: 'customer',
        actorId: String(userId),
        note: 'User rejected the final service cost',
        media: { photos: [], videos: [] },
        timestamp: new Date(),
      });
      await request.save();
      logger.info(`User rejected actual cost for request=${requestId}`);
      return success(res, 'Service request cancelled — final cost rejected', {
        request: request.toObject(),
      });
    }

    request.actualCostUserDecision = 'accepted';
    request.actualCostAcceptedAt = new Date();
    request.lifecycleEvents.push({
      state: request.trackingState || 'request_created',
      status: request.status,
      actorType: 'customer',
      actorId: String(userId),
      note: `User accepted final service cost (${request.actualCost})`,
      media: { photos: [], videos: [] },
      timestamp: new Date(),
    });
    await request.save();
    logger.info(`User accepted actual cost for request=${requestId}`);
    return success(res, 'Final service cost accepted — workflow may continue', {
      request: request.toObject(),
    });
  } catch (err) {
    logger.error(`Respond to actual cost error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

/**
 * Upload service request media evidence
 * POST /api/service/upload-media
 */
/**
 * Upload service request proof image (before create) — returns Cloudinary URL for photos[] on create.
 * POST /api/service/upload-proof/image
 */
const uploadServiceProofImage = async (req, res) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'No file uploaded', 400);
    }
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'getmypair/service-requests/proof',
      resource_type: 'image',
      public_id: `svc-proof-img-${Date.now()}`,
      transformation: [{ width: 1600, height: 1600, crop: 'limit', quality: 'auto' }],
    });
    return success(res, 'Proof image uploaded successfully', {
      url: result.secure_url,
      mediaType: 'image',
    });
  } catch (err) {
    logger.error(`Upload service proof image error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

/**
 * Upload service request proof video — returns Cloudinary URL for videos[] on create.
 * POST /api/service/upload-proof/video
 */
const uploadServiceProofVideo = async (req, res) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'No file uploaded', 400);
    }
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'getmypair/service-requests/proof',
      resource_type: 'video',
      public_id: `svc-proof-vid-${Date.now()}`,
    });
    return success(res, 'Proof video uploaded successfully', {
      url: result.secure_url,
      mediaType: 'video',
    });
  } catch (err) {
    logger.error(`Upload service proof video error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

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

/**
 * List new service requests for cobblers (unassigned).
 * GET /api/service/cobbler/new-requests
 */
const cobblerListNewRequests = async (req, res) => {
  try {
    const cobblerId = req.user._id;
    const requests = await ServiceRequest.find({
      status: 'pending',
      cobblerId: null,
      cobblerDeclinedBy: { $ne: cobblerId },
    })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    return success(res, 'New requests retrieved successfully', { requests });
  } catch (err) {
    logger.error(`Cobbler list new requests error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

/**
 * Cobbler rejects/declines a service request.
 * POST /api/service/cobbler/reject
 * Body: { requestId, reason? }
 */
const cobblerRejectRequest = async (req, res) => {
  try {
    const cobblerId = req.user._id;
    const { requestId, reason } = req.body;

    const request = await ServiceRequest.findById(requestId);
    if (!request) {
      return notFound(res, 'Service request not found');
    }
    if (request.status === 'cancelled' || request.status === 'completed') {
      return errorResponse(res, `Cannot reject a ${request.status} request`, 400);
    }
    if (request.cobblerId) {
      return errorResponse(res, 'This request is already assigned to a cobbler', 400);
    }

    request.cobblerDeclinedBy = Array.isArray(request.cobblerDeclinedBy)
      ? request.cobblerDeclinedBy
      : [];
    const alreadyDeclined = request.cobblerDeclinedBy.some(
      (id) => String(id) === String(cobblerId)
    );
    if (!alreadyDeclined) {
      request.cobblerDeclinedBy.push(cobblerId);
    }

    request.lifecycleEvents = Array.isArray(request.lifecycleEvents) ? request.lifecycleEvents : [];
    request.lifecycleEvents.push({
      state: request.trackingState || 'request_created',
      status: request.status,
      actorType: 'cobbler',
      actorId: String(cobblerId),
      note: reason ? `Cobbler declined: ${String(reason).trim()}` : 'Cobbler declined the request',
      media: { photos: [], videos: [] },
      timestamp: new Date(),
    });

    await request.save();
    return success(res, 'Request rejected successfully', { request: request.toObject() });
  } catch (err) {
    logger.error(`Cobbler reject request error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

/**
 * Cobbler accepts a service request (assigns to themselves).
 * POST /api/service/cobbler/accept
 * Body: { requestId }
 */
const cobblerAcceptRequest = async (req, res) => {
  try {
    const cobblerId = req.user._id;
    const { requestId } = req.body;

    const cobblerProfile = await CobblerProfile.findOne({
      userId: cobblerId,
      verificationStatus: 'verified',
    }).lean();
    if (!cobblerProfile) {
      return errorResponse(res, 'Only verified cobblers can accept requests', 403);
    }

    const request = await ServiceRequest.findById(requestId);
    if (!request) {
      return notFound(res, 'Service request not found');
    }
    if (request.status === 'cancelled' || request.status === 'completed') {
      return errorResponse(res, `Cannot accept a ${request.status} request`, 400);
    }
    if (request.cobblerId) {
      return errorResponse(res, 'This request is already assigned to a cobbler', 400);
    }

    request.cobblerId = cobblerId;
    request.cobblerProfileId = cobblerProfile._id;
    request.cobblerAssignedAt = new Date();
    request.lifecycleEvents = Array.isArray(request.lifecycleEvents) ? request.lifecycleEvents : [];
    request.lifecycleEvents.push({
      state: request.trackingState || 'request_created',
      status: request.status,
      actorType: 'cobbler',
      actorId: String(cobblerId),
      note: 'Cobbler accepted the request',
      media: { photos: [], videos: [] },
      timestamp: new Date(),
    });
    await request.save();

    return success(res, 'Request accepted successfully', { request: request.toObject() });
  } catch (err) {
    logger.error(`Cobbler accept request error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

/**
 * Cobbler sets the final actual cost (requires user acceptance later).
 * POST /api/service/cobbler/set-actual-cost
 * Body: { requestId, actualCost }
 */
const cobblerSetActualCost = async (req, res) => {
  try {
    const cobblerId = req.user._id;
    const { requestId, actualCost } = req.body;

    const request = await ServiceRequest.findById(requestId);
    if (!request) {
      return notFound(res, 'Service request not found');
    }
    if (String(request.cobblerId || '') !== String(cobblerId)) {
      return errorResponse(res, 'You are not assigned to this request', 403);
    }
    if (request.status === 'cancelled' || request.status === 'completed') {
      return errorResponse(res, `Cannot set actual cost for ${request.status} request`, 400);
    }

    const costNum = Number(actualCost);
    if (Number.isNaN(costNum) || costNum < 0) {
      return errorResponse(res, 'actualCost must be a non-negative number', 400);
    }

    request.actualCost = costNum;
    request.actualCostUserDecision = 'pending';
    request.actualCostAcceptedAt = null;
    request.trackingUpdatedAt = new Date();
    request.lifecycleEvents = Array.isArray(request.lifecycleEvents) ? request.lifecycleEvents : [];
    request.lifecycleEvents.push({
      state: request.trackingState || 'request_created',
      status: request.status,
      actorType: 'cobbler',
      actorId: String(cobblerId),
      note: `Cobbler proposed final service cost (${costNum})`,
      media: { photos: [], videos: [] },
      timestamp: new Date(),
    });

    await request.save();
    return success(res, 'Actual cost set successfully. Awaiting user approval.', {
      request: request.toObject(),
    });
  } catch (err) {
    logger.error(`Cobbler set actual cost error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

/**
 * List active requests assigned to cobbler.
 * GET /api/service/cobbler/active
 */
const cobblerListActiveRequests = async (req, res) => {
  try {
    const cobblerId = req.user._id;
    const requests = await ServiceRequest.find({
      cobblerId,
      status: { $nin: ['completed', 'cancelled'] },
    })
      .sort({ updatedAt: -1 })
      .limit(200)
      .lean();

    return success(res, 'Active requests retrieved successfully', { requests });
  } catch (err) {
    logger.error(`Cobbler list active requests error: ${err.message}`);
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
  respondToActualCost,
  cobblerListNewRequests,
  cobblerAcceptRequest,
  cobblerRejectRequest,
  cobblerSetActualCost,
  cobblerListActiveRequests,
  uploadServiceProofImage,
  uploadServiceProofVideo,
  uploadServiceMedia,
};

