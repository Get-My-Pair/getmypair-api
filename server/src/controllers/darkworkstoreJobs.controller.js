/**
 * Darkworkstore job inbox — accept / reject user-app service requests, then assign a store cobbler.
 */

const mongoose = require('mongoose');
const { ServiceRequest } = require('../models/serviceRequest.model');
const User = require('../models/user.model');
const Article = require('../models/article.model');
const CobblerProfile = require('../models/cobblerProfile.model');
const darkstorePayment = require('../services/darkstorePayment.service');
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

module.exports = {
  overviewStats,
  listJobs,
  acceptJob,
  rejectJob,
  assignCobbler,
};
