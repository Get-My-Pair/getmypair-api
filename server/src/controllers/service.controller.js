/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : service.controller.js
 * Description: Module 4 – Service Request create
 * ----------------------------------------------------------------------------
 */

const mongoose = require('mongoose');
const { ServiceRequest, defaultEstimatedCostByServiceType } = require('../models/serviceRequest.model');
const Article = require('../models/article.model');
const UserProfile = require('../models/userProfile.model');
const DeliveryProfile = require('../models/deliveryProfile.model');
const { success, error: errorResponse, notFound } = require('../utils/response');
const logger = require('../utils/logger');

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
    });

    logger.info(`Service request created: ${doc._id} user=${userId} article=${articleId} type=${serviceType}`);
    return success(res, 'Service request created successfully', { request: doc }, 201);
  } catch (err) {
    logger.error(`Create service request error: ${err.message}`);
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

module.exports = {
  createServiceRequest,
  getMyServiceRequests,
  getEstimationDefaults,
  assignDeliveryPartner,
};

