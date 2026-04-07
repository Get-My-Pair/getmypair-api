/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : adminDashboard.controller.js
 * Description: Master admin HTML dashboard APIs – login, stats, lists
 * ----------------------------------------------------------------------------
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config/env');
const AdminMaster = require('../models/adminMaster.model');
const User = require('../models/user.model');
const Role = require('../models/role.model');
const Article = require('../models/article.model');
const {
  ServiceRequest,
  serviceTrackingStates,
  serviceStatuses,
} = require('../models/serviceRequest.model');
const CobblerProfile = require('../models/cobblerProfile.model');
const DeliveryProfile = require('../models/deliveryProfile.model');
const UserProfile = require('../models/userProfile.model');
const mongoose = require('mongoose');
const { success, error: errorResponse, unauthorized } = require('../utils/response');
const logger = require('../utils/logger');

const buildAdminToken = (adminId) =>
  jwt.sign(
    {
      type: 'admin_master',
      adminMasterId: String(adminId),
    },
    config.JWT_SECRET,
    {
      expiresIn: config.ADMIN_JWT_EXPIRE || '12h',
    }
  );

/**
 * POST /api/sys-admin/auth/login
 */
const login = async (req, res) => {
  try {
    const email = String(req.body.email || '').toLowerCase().trim();
    const password = req.body.password;

    const admin = await AdminMaster.findOne({ email }).select('+passwordHash');
    if (!admin || !admin.isActive) {
      return unauthorized(res, 'Invalid email or password');
    }

    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) {
      return unauthorized(res, 'Invalid email or password');
    }

    admin.lastLoginAt = new Date();
    await admin.save();

    const accessToken = buildAdminToken(admin._id);

    logger.info(`Master admin login: ${email}`);

    return success(res, 'Login successful', {
      accessToken,
      admin: {
        email: admin.email,
        name: admin.name,
      },
    });
  } catch (err) {
    logger.error(`Admin login error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

/**
 * GET /api/sys-admin/auth/me
 */
const me = async (req, res) => {
  try {
    return success(res, 'OK', { admin: req.adminMaster });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

/**
 * GET /api/sys-admin/dashboard/stats
 */
const dashboardStats = async (req, res) => {
  try {
    const [
      usersCount,
      articlesCount,
      serviceRequestsCount,
      cobblersCount,
      deliveryCount,
    ] = await Promise.all([
      User.countDocuments(),
      Article.countDocuments(),
      ServiceRequest.countDocuments(),
      CobblerProfile.countDocuments(),
      DeliveryProfile.countDocuments(),
    ]);

    return success(res, 'Dashboard stats', {
      usersCount,
      articlesCount,
      serviceRequestsCount,
      cobblersCount,
      deliveryCount,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    logger.error(`Dashboard stats error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

/**
 * GET /api/sys-admin/users?page=1&limit=50
 */
const listUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      User.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(),
    ]);

    await Role.initializeDefaultRoles();
    const validRoleIds = [
      ...new Set(
        items
          .map((u) => u.role)
          .filter((id) => id != null && mongoose.isValidObjectId(id))
          .map((id) => String(id))
      ),
    ];
    const invalidRoleNames = [
      ...new Set(
        items
          .filter((u) => u.role != null && !mongoose.isValidObjectId(u.role))
          .map((u) => String(u.role).trim().toUpperCase())
      ),
    ];

    const rolesById = {};
    if (validRoleIds.length) {
      const oidList = validRoleIds.map((id) => new mongoose.Types.ObjectId(id));
      const rlist = await Role.find({ _id: { $in: oidList } }).select('name').lean();
      rlist.forEach((r) => {
        rolesById[String(r._id)] = r;
      });
    }
    const rolesByName = {};
    for (const name of invalidRoleNames) {
      rolesByName[name] =
        (await Role.findOne({ name }).select('name').lean()) ||
        (await Role.findOne({ name: 'USER' }).select('name').lean());
    }

    for (const u of items) {
      if (u.role == null) {
        u.role = null;
      } else if (mongoose.isValidObjectId(u.role)) {
        u.role = rolesById[String(u.role)] || null;
      } else {
        u.role = rolesByName[String(u.role).trim().toUpperCase()] || null;
      }
    }

    return success(res, 'Users list', {
      items,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    });
  } catch (err) {
    logger.error(`List users error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

/**
 * Normalize article row: ownerId populated → flat `owner` + string ownerId
 */
const mapArticleRow = (doc) => {
  const row = { ...doc };
  const pop = row.ownerId;
  if (pop && typeof pop === 'object' && pop._id) {
    row.owner = {
      id: String(pop._id),
      name: pop.name || '—',
      email: pop.email || '',
      mobile: pop.mobile || '',
    };
    row.ownerId = row.owner.id;
  } else if (pop) {
    row.owner = null;
    row.ownerId = String(pop);
  } else {
    row.owner = null;
    row.ownerId = '';
  }
  return row;
};

/**
 * GET /api/sys-admin/articles/by-owner
 * Owners grouped with article counts (for admin UI drill-down).
 */
const listArticleOwnersSummary = async (req, res) => {
  try {
    const items = await Article.aggregate([
      { $group: { _id: '$ownerId', articleCount: { $sum: 1 } } },
      { $sort: { articleCount: -1, _id: 1 } },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userArr',
        },
      },
      {
        $project: {
          ownerId: '$_id',
          articleCount: 1,
          name: {
            $ifNull: [{ $arrayElemAt: ['$userArr.name', 0] }, 'Unknown user'],
          },
          email: { $arrayElemAt: ['$userArr.email', 0] },
          mobile: { $arrayElemAt: ['$userArr.mobile', 0] },
        },
      },
    ]);

    return success(res, 'Article owners summary', { items });
  } catch (err) {
    logger.error(`Article owners summary error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

/**
 * GET /api/sys-admin/articles?page=1&limit=50&ownerId=<optional>
 */
const listArticles = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.ownerId && mongoose.Types.ObjectId.isValid(req.query.ownerId)) {
      filter.ownerId = new mongoose.Types.ObjectId(req.query.ownerId);
    }

    const [rawItems, total] = await Promise.all([
      Article.find(filter)
        .populate('ownerId', 'name email mobile')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Article.countDocuments(filter),
    ]);

    const items = rawItems.map(mapArticleRow);

    return success(res, 'Articles list', {
      items,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    });
  } catch (err) {
    logger.error(`List articles error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

/** Same mapping as service.controller — keeps app status in sync with trackingState */
const trackingStateToStatusMap = {
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

const mapServiceRequestRow = (doc) => {
  const row = { ...doc };
  const u = row.userId;
  if (u && typeof u === 'object' && u._id) {
    row.user = {
      id: String(u._id),
      _id: String(u._id),
      name: u.name || '—',
      mobile: u.mobile || '',
      email: u.email || '',
    };
    row.userId = row.user.id;
  } else if (u) {
    row.user = null;
    row.userId = String(u);
  } else {
    row.user = null;
    row.userId = '';
  }
  const art = row.articleId;
  if (art && typeof art === 'object' && art._id) {
    row.article = {
      id: String(art._id),
      brand: art.brand || '',
      model: art.model || '',
      category: art.category || '',
      color: art.color || '',
      purchaseYear: art.purchaseYear != null ? art.purchaseYear : null,
      condition: art.condition || '',
      images: Array.isArray(art.images) ? art.images : [],
    };
    row.articleId = row.article.id;
  } else if (art) {
    row.article = null;
    row.articleId = String(art);
  } else {
    row.article = null;
    row.articleId = '';
  }
  return row;
};

/**
 * GET /api/sys-admin/service-requests?page=1&limit=50
 */
const listServiceRequests = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const skip = (page - 1) * limit;

    const [rawItems, total] = await Promise.all([
      ServiceRequest.find()
        .populate('userId', 'name mobile email')
        .populate('articleId', 'brand model')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ServiceRequest.countDocuments(),
    ]);

    const items = rawItems.map(mapServiceRequestRow);

    return success(res, 'Service requests list', {
      items,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    });
  } catch (err) {
    logger.error(`List service requests error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

/**
 * GET /api/sys-admin/service-requests/:id
 * Full detail for admin: user, article, resolved pickup address, media, costs, timeline.
 */
const getServiceRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid request id', 400);
    }

    const raw = await ServiceRequest.findById(id)
      .populate('userId', 'name mobile email')
      .populate('articleId', 'brand model category color purchaseYear condition images')
      .lean();

    if (!raw) {
      return errorResponse(res, 'Service request not found', 404);
    }

    const row = mapServiceRequestRow(raw);
    const uid =
      raw.userId && typeof raw.userId === 'object' && raw.userId._id
        ? raw.userId._id
        : raw.userId;

    let address = null;
    if (raw.addressId && uid) {
      const profile = await UserProfile.findOne({ userId: uid }).lean();
      if (profile && Array.isArray(profile.addresses)) {
        const aid = String(raw.addressId);
        const match = profile.addresses.find((a) => String(a._id) === aid);
        if (match) {
          address = {
            id: String(match._id),
            addressLine1: match.addressLine1,
            city: match.city,
            state: match.state,
            pincode: match.pincode,
          };
        }
      }
    }
    row.address = address;
    row.addressId = raw.addressId ? String(raw.addressId) : '';

    return success(res, 'Service request', { request: row });
  } catch (err) {
    logger.error(`Admin get service request error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

/**
 * DELETE /api/sys-admin/service-requests/:id
 * Hard delete (testing / ops). User app will 404 on that request id.
 */
const deleteServiceRequest = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid request id', 400);
    }
    const deleted = await ServiceRequest.findByIdAndDelete(id);
    if (!deleted) {
      return errorResponse(res, 'Service request not found', 404);
    }
    return success(res, 'Service request deleted', { id });
  } catch (err) {
    logger.error(`Admin delete service request error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

/**
 * PATCH /api/sys-admin/service-requests/:id
 * Body (at least one of): trackingState?, status?, note?,
 *   deliveryPartnerId?, cobblerId?, darkStoreId?, darkStoreName?, routingType?,
 *   estimatedCost?, actualCost? (number or null to clear)
 * Partner ids: verified profile userId, or null to clear. darkStoreId: string or null to clear.
 */
const patchServiceRequestWorkflow = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid request id', 400);
    }

    const body = req.body || {};
    const {
      trackingState: nextStateRaw,
      status: bodyStatus,
      note,
      deliveryPartnerId: bodyDelivery,
      cobblerId: bodyCobbler,
      darkStoreId: bodyDarkId,
      darkStoreName: bodyDarkName,
      routingType: bodyRouting,
      estimatedCost: bodyEst,
      actualCost: bodyAct,
    } = body;

    const request = await ServiceRequest.findById(id);
    if (!request) {
      return errorResponse(res, 'Service request not found', 404);
    }

    const parseMoneyField = (val, fieldName) => {
      if (val === null || val === '') {
        return { ok: true, value: null };
      }
      const n = Number(val);
      if (!Number.isFinite(n) || n < 0) {
        return { ok: false, error: `${fieldName} must be a non-negative number or null` };
      }
      return { ok: true, value: n };
    };

    let stateUpdated = false;
    const assignmentNotes = [];

    if (Object.prototype.hasOwnProperty.call(body, 'estimatedCost')) {
      const parsed = parseMoneyField(bodyEst, 'estimatedCost');
      if (!parsed.ok) {
        return errorResponse(res, parsed.error, 400);
      }
      request.estimatedCost = parsed.value;
      assignmentNotes.push(`estimatedCost=${parsed.value === null ? 'cleared' : parsed.value}`);
    }

    if (Object.prototype.hasOwnProperty.call(body, 'actualCost')) {
      const parsed = parseMoneyField(bodyAct, 'actualCost');
      if (!parsed.ok) {
        return errorResponse(res, parsed.error, 400);
      }
      const prevAct = request.actualCost;
      request.actualCost = parsed.value;
      if (parsed.value === null) {
        request.actualCostUserDecision = null;
        request.actualCostAcceptedAt = null;
      } else if (prevAct !== parsed.value) {
        request.actualCostUserDecision = 'pending';
        request.actualCostAcceptedAt = null;
      }
      assignmentNotes.push(`actualCost=${parsed.value === null ? 'cleared' : parsed.value}`);
    }

    const isAwaitingUserOnActualCost =
      request.actualCost != null &&
      request.actualCostUserDecision === 'pending';

    if (nextStateRaw !== undefined && nextStateRaw !== null && String(nextStateRaw).trim() !== '') {
      const trimmed = String(nextStateRaw).trim();
      if (!serviceTrackingStates.includes(trimmed)) {
        return errorResponse(
          res,
          `trackingState must be one of: ${serviceTrackingStates.join(', ')}`,
          400
        );
      }
      let nextStatus =
        bodyStatus && serviceStatuses.includes(bodyStatus)
          ? bodyStatus
          : trackingStateToStatusMap[trimmed] || request.status;
      if (!serviceStatuses.includes(nextStatus)) {
        nextStatus = request.status;
      }
      const currentTs = request.trackingState || 'request_created';
      if (trimmed !== currentTs && isAwaitingUserOnActualCost) {
        return errorResponse(
          res,
          'User must accept or reject the final service cost before workflow can be updated.',
          400
        );
      }
      request.status = nextStatus;
      request.trackingState = trimmed;
      stateUpdated = true;
    } else if (bodyStatus !== undefined && serviceStatuses.includes(bodyStatus)) {
      if (bodyStatus !== request.status && isAwaitingUserOnActualCost) {
        return errorResponse(
          res,
          'User must accept or reject the final service cost before status can be updated.',
          400
        );
      }
      request.status = bodyStatus;
      stateUpdated = true;
    }

    const triesAssignmentPatch =
      Object.prototype.hasOwnProperty.call(body, 'deliveryPartnerId') ||
      Object.prototype.hasOwnProperty.call(body, 'cobblerId') ||
      Object.prototype.hasOwnProperty.call(body, 'darkStoreId') ||
      bodyDarkName !== undefined ||
      bodyRouting !== undefined;
    if (triesAssignmentPatch && isAwaitingUserOnActualCost) {
      return errorResponse(
        res,
        'User must accept or reject the final service cost before assignments or routing can be updated.',
        400
      );
    }

    if (Object.prototype.hasOwnProperty.call(body, 'deliveryPartnerId')) {
      if (bodyDelivery === null || bodyDelivery === '') {
        request.deliveryPartnerId = null;
        request.deliveryProfileId = null;
        request.pickupAssignedAt = null;
        assignmentNotes.push('delivery cleared');
      } else if (!mongoose.Types.ObjectId.isValid(bodyDelivery)) {
        return errorResponse(res, 'deliveryPartnerId must be a valid ObjectId or null', 400);
      } else {
        const partnerProfile = await DeliveryProfile.findOne({
          userId: bodyDelivery,
          verificationStatus: 'verified',
        }).lean();
        if (!partnerProfile) {
          return errorResponse(res, 'Verified delivery partner not found for this userId', 404);
        }
        request.deliveryPartnerId = partnerProfile.userId;
        request.deliveryProfileId = partnerProfile._id;
        if (!request.pickupAssignedAt) {
          request.pickupAssignedAt = new Date();
        }
        assignmentNotes.push(`delivery → ${partnerProfile.name || String(partnerProfile.userId)}`);
      }
    }

    if (Object.prototype.hasOwnProperty.call(body, 'cobblerId')) {
      if (bodyCobbler === null || bodyCobbler === '') {
        request.cobblerId = null;
        request.cobblerProfileId = null;
        request.cobblerAssignedAt = null;
        assignmentNotes.push('cobbler cleared');
      } else if (!mongoose.Types.ObjectId.isValid(bodyCobbler)) {
        return errorResponse(res, 'cobblerId must be a valid ObjectId or null', 400);
      } else {
        const cobblerProfile = await CobblerProfile.findOne({
          userId: bodyCobbler,
          verificationStatus: 'verified',
        }).lean();
        if (!cobblerProfile) {
          return errorResponse(res, 'Verified cobbler not found for this userId', 404);
        }
        request.cobblerId = cobblerProfile.userId;
        request.cobblerProfileId = cobblerProfile._id;
        if (!request.cobblerAssignedAt) {
          request.cobblerAssignedAt = new Date();
        }
        assignmentNotes.push(`cobbler → ${cobblerProfile.name || String(cobblerProfile.userId)}`);
      }
    }

    if (Object.prototype.hasOwnProperty.call(body, 'darkStoreId')) {
      if (bodyDarkId === null || bodyDarkId === '') {
        request.darkStoreId = null;
        request.darkStoreName = null;
        request.darkStoreAssignedAt = null;
        assignmentNotes.push('dark store cleared');
      } else {
        const ds = String(bodyDarkId).trim();
        if (!ds) {
          return errorResponse(res, 'darkStoreId cannot be empty when provided', 400);
        }
        request.darkStoreId = ds;
        if (bodyDarkName !== undefined) {
          request.darkStoreName = bodyDarkName ? String(bodyDarkName).trim() : null;
        }
        if (bodyRouting !== undefined && ['dark_store', 'direct'].includes(bodyRouting)) {
          request.routingType = bodyRouting;
        }
        request.darkStoreAssignedAt = new Date();
        assignmentNotes.push(
          `dark store → ${ds}${request.darkStoreName ? ` (${request.darkStoreName})` : ''}`
        );
      }
    } else if (bodyDarkName !== undefined || bodyRouting !== undefined) {
      if (bodyDarkName !== undefined) {
        request.darkStoreName = bodyDarkName ? String(bodyDarkName).trim() : null;
      }
      if (bodyRouting !== undefined && ['dark_store', 'direct'].includes(bodyRouting)) {
        request.routingType = bodyRouting;
      }
      assignmentNotes.push('dark store details updated');
    }

    const assignmentChanged = assignmentNotes.length > 0;
    if (!stateUpdated && !assignmentChanged) {
      return errorResponse(
        res,
        'No updates: send trackingState/status, assignments, dark store, and/or estimatedCost/actualCost',
        400
      );
    }

    request.trackingUpdatedAt = new Date();

    const userNote = note && String(note).trim() ? String(note).trim() : '';
    const autoNote = assignmentNotes.length ? `Assignments: ${assignmentNotes.join('; ')}` : '';
    const combinedNote = [userNote, autoNote].filter(Boolean).join(' — ') || null;

    request.lifecycleEvents = Array.isArray(request.lifecycleEvents) ? request.lifecycleEvents : [];
    request.lifecycleEvents.push({
      state: request.trackingState,
      status: request.status,
      actorType: 'admin',
      actorId: req.adminMaster ? String(req.adminMaster._id) : 'admin',
      note: combinedNote,
      media: { photos: [], videos: [] },
      timestamp: new Date(),
    });

    await request.save();
    const populated = await ServiceRequest.findById(request._id)
      .populate('userId', 'name mobile email')
      .populate('articleId', 'brand model')
      .lean();
    return success(res, 'Request updated', {
      request: mapServiceRequestRow(populated),
    });
  } catch (err) {
    logger.error(`Admin patch service request error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

/**
 * GET /api/sys-admin/cobblers?page=1&limit=50
 */
const listCobblers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      CobblerProfile.find().sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
      CobblerProfile.countDocuments(),
    ]);

    return success(res, 'Cobblers list', {
      items,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    });
  } catch (err) {
    logger.error(`List cobblers error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

/**
 * PATCH /api/sys-admin/cobblers/:id/verify
 * Body: { status?: 'pending' | 'verified' | 'rejected' } (default: 'verified')
 */
const verifyCobbler = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid cobbler profile id', 400);
    }

    const requested = String(req.body.status || 'verified').trim().toLowerCase();
    const allowed = ['pending', 'verified', 'rejected'];
    if (!allowed.includes(requested)) {
      return errorResponse(res, `status must be one of: ${allowed.join(', ')}`, 400);
    }

    const profile = await CobblerProfile.findById(id);
    if (!profile) {
      return errorResponse(res, 'Cobbler profile not found', 404);
    }

    profile.verificationStatus = requested;
    await profile.save();

    return success(res, 'Cobbler verification updated', {
      id: String(profile._id),
      verificationStatus: profile.verificationStatus,
      updatedAt: profile.updatedAt,
    });
  } catch (err) {
    logger.error(`Verify cobbler error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

/**
 * GET /api/sys-admin/delivery-partners?page=1&limit=50
 */
const listDeliveryPartners = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      DeliveryProfile.find().sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
      DeliveryProfile.countDocuments(),
    ]);

    return success(res, 'Delivery partners list', {
      items,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    });
  } catch (err) {
    logger.error(`List delivery partners error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

module.exports = {
  login,
  me,
  dashboardStats,
  listUsers,
  listArticleOwnersSummary,
  listArticles,
  listServiceRequests,
  getServiceRequestById,
  deleteServiceRequest,
  patchServiceRequestWorkflow,
  listCobblers,
  verifyCobbler,
  listDeliveryPartners,
};
