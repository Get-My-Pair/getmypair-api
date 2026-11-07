/**
 * Repairshops job inbox — accept / reject user-app service requests, then assign a store cobbler.
 */

const mongoose = require('mongoose');
const { ServiceRequest } = require('../models/serviceRequest.model');
const User = require('../models/user.model');
const UserProfile = require('../models/userProfile.model');
const Article = require('../models/article.model');
const CobblerProfile = require('../models/cobblerProfile.model');
const darkstorePayment = require('../services/darkstorePayment.service');
const workflow = require('../services/deliveryWorkflow.service');
const AdminMaster = require('../models/adminMaster.model');
const { success, error: errorResponse, notFound } = require('../utils/response');
const logger = require('../utils/logger');
const { allocatePublicId } = require('../utils/gmpPublicId');

function formatPickupLine(addr) {
  if (!addr) return '';
  return [addr.addressLine1, addr.line, addr.street, addr.area, addr.city, addr.state, addr.pincode]
    .filter(Boolean)
    .join(', ');
}

function storeId(req) {
  return String(req.adminMaster._id);
}

function storeName(req) {
  return String(req.adminMaster.storeName || req.adminMaster.name || 'Repairshops').trim();
}

function pushLifecycle(request, req, note) {
  request.lifecycleEvents = Array.isArray(request.lifecycleEvents) ? request.lifecycleEvents : [];
  request.lifecycleEvents.push({
    state: request.trackingState || 'request_created',
    status: request.status,
    actorType: 'dark_store',
    actorId: storeId(req),
    note,
    media: { photos: [], videos: [] },
    timestamp: new Date(),
  });
}

async function enrichJobs(requests) {
  if (!requests.length) return [];
  const userIds = [...new Set(requests.map((r) => String(r.userId)).filter(Boolean))];
  const articleIds = [...new Set(requests.map((r) => String(r.articleId)).filter(Boolean))];
  const cobblerIds = [
    ...new Set(requests.map((r) => (r.cobblerId ? String(r.cobblerId) : null)).filter(Boolean)),
  ];
  const deliveryIds = [
    ...new Set(
      requests.map((r) => (r.deliveryMemberId ? String(r.deliveryMemberId) : null)).filter(Boolean)
    ),
  ];

  const [users, profiles, articles, cobblers, deliveryMembers] = await Promise.all([
    userIds.length
      ? User.find({ _id: { $in: userIds } }).select('name mobile email').lean()
      : [],
    userIds.length
      ? UserProfile.find({ userId: { $in: userIds } }).select('userId addresses').lean()
      : [],
    articleIds.length
      ? Article.find({ _id: { $in: articleIds } })
          .select('name brand model shoeSize images')
          .lean()
      : [],
    cobblerIds.length
      ? CobblerProfile.find({ userId: { $in: cobblerIds } }).select('userId name phone shopName').lean()
      : [],
    deliveryIds.length
      ? AdminMaster.find({ _id: { $in: deliveryIds } }).select('name email phone').lean()
      : [],
  ]);

  const userMap = Object.fromEntries(users.map((u) => [String(u._id), u]));
  const profileMap = Object.fromEntries(profiles.map((p) => [String(p.userId), p]));
  const articleMap = Object.fromEntries(articles.map((a) => [String(a._id), a]));
  const cobblerMap = Object.fromEntries(cobblers.map((c) => [String(c.userId), c]));
  const deliveryMap = Object.fromEntries(deliveryMembers.map((d) => [String(d._id), d]));

  // Backfill coded publicId for older requests so Overview Order ID shows CHSHWA1234AM-style codes.
  await Promise.all(
    requests.map(async (r) => {
      if (r.publicId && String(r.publicId).trim()) return;
      try {
        for (let attempt = 0; attempt < 3; attempt += 1) {
          const coded = await allocatePublicId({ serviceType: r.serviceType });
          try {
            const updated = await ServiceRequest.findOneAndUpdate(
              {
                _id: r._id,
                $or: [
                  { publicId: null },
                  { publicId: { $exists: false } },
                  { publicId: '' },
                ],
              },
              { $set: { publicId: coded.publicId } },
              { new: true }
            ).select('publicId').lean();
            r.publicId = updated?.publicId || coded.publicId;
            break;
          } catch (dupErr) {
            if (dupErr?.code !== 11000 || attempt === 2) throw dupErr;
          }
        }
      } catch (err) {
        logger.warn(`publicId backfill failed for ${r._id}: ${err.message}`);
      }
    })
  );

  return requests.map((r) => {
    const profile = profileMap[String(r.userId)] || null;
    const addresses = Array.isArray(profile?.addresses) ? profile.addresses : [];
    const matched =
      addresses.find((a) => String(a._id) === String(r.addressId)) || addresses[0] || null;
    const line = formatPickupLine(matched);
    const pickupAddress = matched
      ? {
          ...matched,
          line,
          addressLine1: matched.addressLine1 || matched.line || '',
          city: matched.city || '',
          state: matched.state || '',
          pincode: matched.pincode || '',
        }
      : null;

    const article = articleMap[String(r.articleId)] || null;
    const requestPhotos = Array.isArray(r.photos) ? r.photos.filter(Boolean) : [];
    const articleImages = Array.isArray(article?.images) ? article.images.filter(Boolean) : [];
    const photos = requestPhotos.length ? requestPhotos : articleImages;

    return {
      ...r,
      user: userMap[String(r.userId)] || null,
      article: article
        ? {
            ...article,
            size: article.shoeSize || article.size || null,
            photos: articleImages,
          }
        : null,
      photos,
      cobbler: r.cobblerId ? cobblerMap[String(r.cobblerId)] || null : null,
      deliveryMember: r.deliveryMemberId
        ? deliveryMap[String(r.deliveryMemberId)] || null
        : null,
      pickupAddress,
      pickupLocationLabel: line || 'Pickup location not set',
    };
  });
}

function inboxFilter(sid) {
  // Unassigned dark-store jobs that still need Accept/Reject.
  // Include PAYMENT_SUCCESS: customers often pay before any shop accepts, which
  // previously removed the job from AWAITING_ACCEPTANCE and hid it entirely.
  return {
    routingType: 'dark_store',
    cobblerId: null,
    status: { $nin: ['cancelled', 'completed'] },
    $and: [
      {
        $or: [
          { darkStoreId: null },
          { darkStoreId: '' },
          { darkStoreId: { $exists: false } },
        ],
      },
      { darkStoreDeclinedBy: { $nin: [sid] } },
      {
        $or: [
          { workflowStatus: 'AWAITING_ACCEPTANCE' },
          { workflowStatus: 'CREATED' },
          { workflowStatus: 'PAYMENT_SUCCESS' },
          { paymentState: 'PAYMENT_SUCCESS' },
        ],
      },
    ],
  };
}

function acceptedFilter(sid) {
  return {
    darkStoreId: sid,
    status: { $ne: 'cancelled' },
  };
}

/** Accepted, waiting for delivery partner to pick up / drop at repair shop. */
function awaitingPickupFilter(sid) {
  const laterStages = [
    'dark_store_received',
    'inspection_started',
    'repair_in_progress',
    'repair_completed',
    'dispatch_ready',
    'out_for_delivery',
    'delivered',
  ];
  return {
    darkStoreId: sid,
    status: { $nin: ['cancelled', 'completed'] },
    trackingState: { $nin: laterStages },
    $or: [
      {
        trackingState: {
          $in: ['request_created', 'pickup_scheduled', 'pickup_assigned', 'item_picked'],
        },
      },
      // Payment-done jobs must appear here even if tracking lagged behind.
      { paymentState: 'PAYMENT_SUCCESS' },
      { workflowStatus: 'PAYMENT_SUCCESS' },
      { workflowStatus: 'PICKUP_SCHEDULED' },
    ],
  };
}

/** Footwear at shop — assign cobbler + internal work (incl. QC). */
function atShopFilter(sid) {
  return {
    darkStoreId: sid,
    status: { $nin: ['cancelled', 'completed'] },
    trackingState: {
      $in: [
        'dark_store_received',
        'inspection_started',
        'repair_in_progress',
        'repair_completed',
      ],
    },
  };
}

/** QC passed — waiting for return delivery partner / out for customer. */
function awaitingReturnFilter(sid) {
  return {
    darkStoreId: sid,
    status: { $nin: ['cancelled', 'completed'] },
    trackingState: {
      $in: ['dispatch_ready', 'out_for_delivery'],
    },
  };
}

/** Customer delivery finished. */
function completedFilter(sid) {
  return {
    darkStoreId: sid,
    $or: [
      { status: 'completed' },
      { trackingState: 'delivered' },
      { workflowStatus: { $in: ['DELIVERED', 'CLOSED'] } },
    ],
  };
}

function filterForStatus(sid, status) {
  switch (status) {
    case 'accepted':
    case 'awaiting_pickup':
      return awaitingPickupFilter(sid);
    case 'at_shop':
    case 'in_shop':
      return atShopFilter(sid);
    case 'awaiting_return':
      return awaitingReturnFilter(sid);
    case 'completed':
    case 'done':
      return completedFilter(sid);
    case 'all':
      return { $or: [inboxFilter(sid), acceptedFilter(sid)] };
    case 'inbox':
    default:
      return inboxFilter(sid);
  }
}

async function jobStageCounts(sid) {
  const [inbox, awaitingPickup, atShop, awaitingReturn, completed] = await Promise.all([
    ServiceRequest.countDocuments(inboxFilter(sid)),
    ServiceRequest.countDocuments(awaitingPickupFilter(sid)),
    ServiceRequest.countDocuments(atShopFilter(sid)),
    ServiceRequest.countDocuments(awaitingReturnFilter(sid)),
    ServiceRequest.countDocuments(completedFilter(sid)),
  ]);
  return {
    inbox,
    awaiting_pickup: awaitingPickup,
    at_shop: atShop,
    awaiting_return: awaitingReturn,
    completed,
    // Legacy keys used by Overview KPI cards
    accepted: awaitingPickup + atShop + awaitingReturn,
  };
}

const overviewStats = async (req, res) => {
  try {
    const sid = storeId(req);
    const [counts, cobblerCount, revenue] = await Promise.all([
      jobStageCounts(sid),
      CobblerProfile.countDocuments({ darkStoreId: sid }),
      darkstorePayment.getRevenueDashboard({ darkStoreId: sid }),
    ]);

    return success(res, 'Dashboard stats', {
      jobCounts: counts,
      cobblerCount,
      revenue,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    logger.error(`Repairshops overview stats error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

const listJobs = async (req, res) => {
  try {
    const sid = storeId(req);
    const status = String(req.query.status || 'inbox').trim().toLowerCase();
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const skip = (page - 1) * limit;
    const filter = filterForStatus(sid, status);

    const [items, total, counts] = await Promise.all([
      ServiceRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      ServiceRequest.countDocuments(filter),
      jobStageCounts(sid),
    ]);

    return success(res, 'Jobs retrieved', {
      items: await enrichJobs(items),
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
      counts,
    });
  } catch (err) {
    logger.error(`Repairshops list jobs error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

const acceptJob = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid job id', 400);
    }

    const sid = storeId(req);
    const request = await ServiceRequest.findById(id);
    if (!request) {
      return notFound(res, 'Service request not found');
    }
    if (request.status === 'cancelled' || request.status === 'completed') {
      return errorResponse(res, `Cannot accept a ${request.status} request`, 400);
    }
    if (request.cobblerId) {
      return errorResponse(res, 'This request is already assigned to a cobbler', 400);
    }
    if (request.darkStoreId && String(request.darkStoreId) !== sid) {
      return errorResponse(res, 'This request is already accepted by another store', 409);
    }
    if ((request.darkStoreDeclinedBy || []).some((d) => String(d) === sid)) {
      return errorResponse(res, 'You already rejected this request', 400);
    }

    request.darkStoreId = sid;
    request.darkStoreName = storeName(req);
    request.darkStoreAssignedAt = new Date();
    request.routingType = 'dark_store';
    request.acceptedProviderType = 'dark_store';
    // After accept: wait for delivery partner pickup/drop — cobbler assign comes later.
    // Keep paid jobs discoverable for delivery assignment (do not rewind payment).
    const alreadyPaid =
      request.paymentState === 'PAYMENT_SUCCESS' ||
      request.workflowStatus === 'PAYMENT_SUCCESS';
    request.workflowStatus = alreadyPaid ? 'PAYMENT_SUCCESS' : 'PICKUP_SCHEDULED';
    if (alreadyPaid) {
      if (
        !request.trackingState ||
        request.trackingState === 'request_created'
      ) {
        request.trackingState = 'pickup_scheduled';
      }
    } else if (!request.trackingState || request.trackingState === 'request_created') {
      request.trackingState = 'request_created';
    }
    pushLifecycle(
      request,
      req,
      alreadyPaid
        ? 'Repairshops accepted paid order — waiting for delivery partner'
        : 'Repairshops accepted — waiting for delivery partner to bring footwear to hub'
    );
    await request.save();

    const [enriched] = await enrichJobs([request.toObject()]);
    return success(res, 'Job accepted', { request: enriched });
  } catch (err) {
    logger.error(`Repairshops accept job error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

const rejectJob = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid job id', 400);
    }

    const sid = storeId(req);
    const reason = String(req.body.reason || '').trim();
    const request = await ServiceRequest.findById(id);
    if (!request) {
      return notFound(res, 'Service request not found');
    }
    if (request.status === 'cancelled' || request.status === 'completed') {
      return errorResponse(res, `Cannot reject a ${request.status} request`, 400);
    }
    if (request.cobblerId) {
      return errorResponse(res, 'This request is already assigned to a cobbler', 400);
    }
    if (request.darkStoreId && String(request.darkStoreId) !== sid) {
      return errorResponse(res, 'This request is already accepted by another store', 409);
    }

    request.darkStoreDeclinedBy = Array.isArray(request.darkStoreDeclinedBy)
      ? request.darkStoreDeclinedBy
      : [];
    if (!request.darkStoreDeclinedBy.some((d) => String(d) === sid)) {
      request.darkStoreDeclinedBy.push(sid);
    }

    if (request.darkStoreId && String(request.darkStoreId) === sid) {
      request.darkStoreId = null;
      request.darkStoreName = null;
      request.darkStoreAssignedAt = null;
      request.acceptedProviderType = null;
    }

    request.workflowStatus = 'AWAITING_ACCEPTANCE';
    request.routingType = 'dark_store';
    pushLifecycle(
      request,
      req,
      reason ? `Repairshops declined: ${reason}` : 'Repairshops declined the request'
    );
    await request.save();

    const [enriched] = await enrichJobs([request.toObject()]);
    return success(res, 'Job rejected', { request: enriched });
  } catch (err) {
    logger.error(`Repairshops reject job error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

const assignCobbler = async (req, res) => {
  try {
    const { id } = req.params;
    const cobblerUserId = String(req.body.cobblerId || '').trim();
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid job id', 400);
    }
    if (!mongoose.Types.ObjectId.isValid(cobblerUserId)) {
      return errorResponse(res, 'Valid cobblerId is required', 400);
    }

    const sid = storeId(req);
    const request = await ServiceRequest.findById(id);
    if (!request) {
      return notFound(res, 'Service request not found');
    }
    if (request.status === 'cancelled' || request.status === 'completed') {
      return errorResponse(res, `Cannot assign a ${request.status} request`, 400);
    }
    if (String(request.darkStoreId || '') !== sid) {
      return errorResponse(res, 'Accept this job before assigning a cobbler', 400);
    }

    const atShopStates = [
      'dark_store_received',
      'inspection_started',
      'repair_in_progress',
    ];
    if (!atShopStates.includes(String(request.trackingState || ''))) {
      return errorResponse(
        res,
        'Assign cobbler only after the delivery partner drops footwear at the repair shop',
        400
      );
    }

    const cobblerProfile = await CobblerProfile.findOne({
      userId: cobblerUserId,
      darkStoreId: sid,
      verificationStatus: 'verified',
    }).lean();
    if (!cobblerProfile) {
      return errorResponse(res, 'Verified store cobbler not found', 404);
    }

    request.cobblerId = cobblerProfile.userId;
    request.cobblerProfileId = cobblerProfile._id;
    request.cobblerAssignedAt = new Date();
    request.workflowStatus = 'IN_PROGRESS';
    request.status = 'in_service';
    pushLifecycle(
      request,
      req,
      `Assigned cobbler ${cobblerProfile.name || cobblerUserId}`
    );
    await request.save();

    const [enriched] = await enrichJobs([request.toObject()]);
    return success(res, 'Cobbler assigned', { request: enriched });
  } catch (err) {
    logger.error(`Repairshops assign cobbler error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

async function pagedJobs(filter, page, limit) {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    workflow.ServiceRequest.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
    workflow.ServiceRequest.countDocuments(filter),
  ]);
  return {
    items: await workflow.enrichDeliveryJobs(items),
    page,
    limit,
    total,
    pages: Math.ceil(total / limit) || 1,
  };
}

const listPickupJobs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const sid = (req.adminMaster.portal || '') === 'masteradmin' ? null : storeId(req);
    const data = await pagedJobs(workflow.pickupReadyFilter(sid), page, limit);
    return success(res, 'Pickup-ready jobs', data);
  } catch (err) {
    logger.error(`List pickup jobs error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

const listReturnJobs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const sid = (req.adminMaster.portal || '') === 'masteradmin' ? null : storeId(req);
    const data = await pagedJobs(workflow.returnReadyFilter(sid), page, limit);
    return success(res, 'Return-delivery jobs', data);
  } catch (err) {
    logger.error(`List return jobs error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

const listWorkflowJobs = async (req, res) => {
  try {
    const tab = String(req.query.tab || 'received').trim().toLowerCase();
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const sid = storeId(req);
    let filter;
    if (tab === 'in_progress') {
      filter = {
        darkStoreId: sid,
        trackingState: { $in: ['inspection_started', 'repair_in_progress'] },
        status: { $nin: ['cancelled', 'completed'] },
      };
    } else if (tab === 'done') {
      filter = {
        darkStoreId: sid,
        trackingState: { $in: ['repair_completed', 'dispatch_ready'] },
        status: { $nin: ['cancelled', 'completed'] },
      };
    } else if (tab === 'out') {
      filter = {
        darkStoreId: sid,
        trackingState: { $in: ['out_for_delivery', 'delivered'] },
      };
    } else {
      filter = workflow.receivedAtStoreFilter(sid);
    }
    const data = await pagedJobs(filter, page, limit);
    return success(res, 'Workflow jobs', data);
  } catch (err) {
    logger.error(`List workflow jobs error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

const assignDelivery = async (req, res) => {
  try {
    const { id } = req.params;
    const deliveryMemberId = String(req.body.deliveryMemberId || '').trim();
    const assignmentType = String(req.body.assignmentType || 'pickup').trim().toLowerCase();
    if (!mongoose.Types.ObjectId.isValid(id)) return errorResponse(res, 'Invalid job id', 400);
    if (!mongoose.Types.ObjectId.isValid(deliveryMemberId)) {
      return errorResponse(res, 'Valid deliveryMemberId is required', 400);
    }
    if (!['pickup', 'return'].includes(assignmentType)) {
      return errorResponse(res, 'assignmentType must be pickup or return', 400);
    }

    const sid = storeId(req);
    const isMaster = (req.adminMaster.portal || '') === 'masteradmin';
    const request = await ServiceRequest.findById(id);
    if (!request) return notFound(res, 'Service request not found');
    if (!isMaster && String(request.darkStoreId || '') !== sid) {
      return errorResponse(res, 'This job is not assigned to your store', 403);
    }
    if (request.status === 'cancelled' || request.status === 'completed') {
      return errorResponse(res, `Cannot assign a ${request.status} job`, 400);
    }

    const member = await AdminMaster.findOne({
      _id: deliveryMemberId,
      portal: 'delivery',
      isVerified: true,
      status: 'verified',
      isActive: true,
    }).lean();
    if (!member) return errorResponse(res, 'Verified delivery member not found', 404);

    if (assignmentType === 'pickup') {
      const paid =
        request.actualCostUserDecision === 'accepted' &&
        (request.paymentState === 'PAYMENT_SUCCESS' || request.workflowStatus === 'PAYMENT_SUCCESS');
      if (!paid) {
        return errorResponse(res, 'Assign pickup only after the customer accepts cost and payment succeeds', 400);
      }
      workflow.applyTracking(request, 'pickup_scheduled', {
        workflowStatus: 'PICKUP_SCHEDULED',
        fields: {
          deliveryMemberId: member._id,
          deliveryAssignmentType: 'pickup',
          deliveryAssignedAt: new Date(),
          pickupAssignedAt: new Date(),
        },
      });
    } else {
      if (request.trackingState !== 'dispatch_ready') {
        return errorResponse(res, 'Assign return delivery only after quality check passes', 400);
      }
      request.deliveryMemberId = member._id;
      request.deliveryAssignmentType = 'return';
      request.deliveryAssignedAt = new Date();
      request.workflowStatus = 'DELIVERY_SCHEDULED';
    }

    workflow.pushLifecycle(request, {
      actorType: isMaster ? 'admin' : 'dark_store',
      actorId: sid,
      note: `Assigned ${assignmentType} to ${member.name || member.email}`,
    });
    await request.save();

    const [job] = await workflow.enrichDeliveryJobs([request.toObject()]);
    return success(res, `Delivery member assigned for ${assignmentType}`, { job });
  } catch (err) {
    logger.error(`Assign delivery error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

const receiveAtStore = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return errorResponse(res, 'Invalid job id', 400);
    const sid = storeId(req);
    const request = await ServiceRequest.findById(id);
    if (!request) return notFound(res, 'Service request not found');
    if (String(request.darkStoreId || '') !== sid) {
      return errorResponse(res, 'This job is not assigned to your store', 403);
    }
    const canReceive = [
      'request_created',
      'pickup_scheduled',
      'pickup_assigned',
      'item_picked',
      'dark_store_received',
    ].includes(String(request.trackingState || ''));
    if (!canReceive) {
      return errorResponse(res, 'Job is not ready to mark received at store', 400);
    }

    workflow.applyTracking(request, 'dark_store_received', { workflowStatus: 'IN_PROGRESS' });
    // Clear pickup assignment so return partner can be assigned later.
    request.deliveryAssignmentType = null;
    workflow.pushLifecycle(request, {
      actorType: 'dark_store',
      actorId: sid,
      note: 'Footwear received at Repairshops — ready to assign cobbler',
    });
    await request.save();
    const [job] = await workflow.enrichDeliveryJobs([request.toObject()]);
    return success(res, 'Marked received at Repairshops', { job });
  } catch (err) {
    logger.error(`Receive at store error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

const updateProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const action = String(req.body.action || '').trim();
    if (!mongoose.Types.ObjectId.isValid(id)) return errorResponse(res, 'Invalid job id', 400);
    const spec = workflow.PROGRESS_ACTIONS[action];
    if (!spec) {
      return errorResponse(res, 'action must be inspection, in_progress, work_done, qc_pass, or qc_fail', 400);
    }

    const sid = storeId(req);
    const request = await ServiceRequest.findById(id);
    if (!request) return notFound(res, 'Service request not found');
    if (String(request.darkStoreId || '') !== sid) {
      return errorResponse(res, 'This job is not assigned to your store', 403);
    }

    workflow.applyTracking(request, spec.trackingState, { workflowStatus: spec.workflowStatus });
    workflow.pushLifecycle(request, {
      actorType: 'dark_store',
      actorId: sid,
      note: spec.note,
    });
    await request.save();
    const [job] = await workflow.enrichDeliveryJobs([request.toObject()]);
    return success(res, spec.note, { job });
  } catch (err) {
    logger.error(`Update progress error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

module.exports = {
  overviewStats,
  listJobs,
  acceptJob,
  rejectJob,
  assignCobbler,
  listPickupJobs,
  listReturnJobs,
  listWorkflowJobs,
  assignDelivery,
  receiveAtStore,
  updateProgress,
};
