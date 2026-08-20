/**
 * Darkworkstore job inbox — accept / reject user-app service requests, then assign a store cobbler.
 */

const mongoose = require('mongoose');
const { ServiceRequest } = require('../models/serviceRequest.model');
const User = require('../models/user.model');
const Article = require('../models/article.model');
const CobblerProfile = require('../models/cobblerProfile.model');
const darkstorePayment = require('../services/darkstorePayment.service');
const workflow = require('../services/deliveryWorkflow.service');
const AdminMaster = require('../models/adminMaster.model');
const { success, error: errorResponse, notFound } = require('../utils/response');
const logger = require('../utils/logger');

function storeId(req) {
  return String(req.adminMaster._id);
}

function storeName(req) {
  return String(req.adminMaster.storeName || req.adminMaster.name || 'Darkworkstore').trim();
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

  const [users, articles, cobblers] = await Promise.all([
    userIds.length
      ? User.find({ _id: { $in: userIds } }).select('name mobile email').lean()
      : [],
    articleIds.length
      ? Article.find({ _id: { $in: articleIds } }).select('name brand model').lean()
      : [],
    cobblerIds.length
      ? CobblerProfile.find({ userId: { $in: cobblerIds } }).select('userId name phone shopName').lean()
      : [],
  ]);

  const userMap = Object.fromEntries(users.map((u) => [String(u._id), u]));
  const articleMap = Object.fromEntries(articles.map((a) => [String(a._id), a]));
  const cobblerMap = Object.fromEntries(cobblers.map((c) => [String(c.userId), c]));

  return requests.map((r) => ({
    ...r,
    user: userMap[String(r.userId)] || null,
    article: articleMap[String(r.articleId)] || null,
    cobbler: r.cobblerId ? cobblerMap[String(r.cobblerId)] || null : null,
  }));
}

function inboxFilter(sid) {
  return {
    routingType: 'dark_store',
    workflowStatus: 'AWAITING_ACCEPTANCE',
    cobblerId: null,
    $and: [
      { $or: [{ darkStoreId: null }, { darkStoreId: '' }] },
      { darkStoreDeclinedBy: { $nin: [sid] } },
    ],
    status: { $nin: ['cancelled', 'completed'] },
  };
}

function acceptedFilter(sid) {
  return {
    darkStoreId: sid,
    status: { $ne: 'cancelled' },
  };
}

const overviewStats = async (req, res) => {
  try {
    const sid = storeId(req);
    const [inboxCount, acceptedCount, cobblerCount, revenue] = await Promise.all([
      ServiceRequest.countDocuments(inboxFilter(sid)),
      ServiceRequest.countDocuments(acceptedFilter(sid)),
      CobblerProfile.countDocuments({ darkStoreId: sid }),
      darkstorePayment.getRevenueDashboard({ darkStoreId: sid }),
    ]);

    return success(res, 'Dashboard stats', {
      jobCounts: { inbox: inboxCount, accepted: acceptedCount },
      cobblerCount,
      revenue,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    logger.error(`Darkworkstore overview stats error: ${err.message}`);
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

    let filter;
    if (status === 'accepted') {
      filter = acceptedFilter(sid);
    } else if (status === 'all') {
      filter = { $or: [inboxFilter(sid), acceptedFilter(sid)] };
    } else {
      filter = inboxFilter(sid);
    }

    const [items, total, inboxCount, acceptedCount] = await Promise.all([
      ServiceRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      ServiceRequest.countDocuments(filter),
      ServiceRequest.countDocuments(inboxFilter(sid)),
      ServiceRequest.countDocuments(acceptedFilter(sid)),
    ]);

    return success(res, 'Jobs retrieved', {
      items: await enrichJobs(items),
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
      counts: { inbox: inboxCount, accepted: acceptedCount },
    });
  } catch (err) {
    logger.error(`Darkworkstore list jobs error: ${err.message}`);
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
    request.workflowStatus = 'COBBLER_PENDING';
    pushLifecycle(request, req, 'Darkworkstore accepted the request');
    await request.save();

    const [enriched] = await enrichJobs([request.toObject()]);
    return success(res, 'Job accepted', { request: enriched });
  } catch (err) {
    logger.error(`Darkworkstore accept job error: ${err.message}`);
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
      reason ? `Darkworkstore declined: ${reason}` : 'Darkworkstore declined the request'
    );
    await request.save();

    const [enriched] = await enrichJobs([request.toObject()]);
    return success(res, 'Job rejected', { request: enriched });
  } catch (err) {
    logger.error(`Darkworkstore reject job error: ${err.message}`);
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
    request.workflowStatus = 'COBBLER_PENDING';
    pushLifecycle(
      request,
      req,
      `Assigned cobbler ${cobblerProfile.name || cobblerUserId}`
    );
    await request.save();

    const [enriched] = await enrichJobs([request.toObject()]);
    return success(res, 'Cobbler assigned', { request: enriched });
  } catch (err) {
    logger.error(`Darkworkstore assign cobbler error: ${err.message}`);
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
    if (!['item_picked', 'pickup_scheduled', 'dark_store_received'].includes(request.trackingState)) {
      return errorResponse(res, 'Job is not ready to mark received at store', 400);
    }

    workflow.applyTracking(request, 'dark_store_received', { workflowStatus: 'IN_PROGRESS' });
    workflow.pushLifecycle(request, {
      actorType: 'dark_store',
      actorId: sid,
      note: 'Footwear received at Darkworkstore',
    });
    await request.save();
    const [job] = await workflow.enrichDeliveryJobs([request.toObject()]);
    return success(res, 'Marked received at Darkworkstore', { job });
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
