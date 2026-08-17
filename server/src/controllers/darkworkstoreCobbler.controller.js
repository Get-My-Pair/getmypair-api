/**
 * Darkworkstore internal cobblers (employees).
 * Creates a cobbler-app User + CobblerProfile scoped to the logged-in store.
 */

const mongoose = require('mongoose');
const User = require('../models/user.model');
const Role = require('../models/role.model');
const CobblerProfile = require('../models/cobblerProfile.model');
const { ServiceRequest } = require('../models/serviceRequest.model');
const { success, error: errorResponse, notFound } = require('../utils/response');
const logger = require('../utils/logger');
const { getLocalMobileDigits, isValidIndianMobile } = require('../utils/validators');

function storeId(req) {
  return String(req.adminMaster._id);
}

function mapCobbler(profile, user) {
  const row = profile && typeof profile.toJSON === 'function' ? profile.toJSON() : { ...profile };
  return {
    id: String(row._id),
    _id: String(row._id),
    userId: String(row.userId),
    name: row.name || user?.name || '',
    phone: row.phone || user?.mobile || '',
    shopName: row.shopName || '',
    shopAddress: row.shopAddress || '',
    verificationStatus: row.verificationStatus || 'pending',
    isOnline: row.isOnline !== false,
    isActive: user?.isActive !== false,
    darkStoreId: row.darkStoreId || null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const listCobblers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const skip = (page - 1) * limit;
    const filter = { darkStoreId: storeId(req) };

    const [profiles, total] = await Promise.all([
      CobblerProfile.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      CobblerProfile.countDocuments(filter),
    ]);

    const userIds = profiles.map((p) => p.userId).filter(Boolean);
    const users = userIds.length
      ? await User.find({ _id: { $in: userIds } }).select('name mobile isActive').lean()
      : [];
    const userMap = Object.fromEntries(users.map((u) => [String(u._id), u]));

    return success(res, 'Cobblers retrieved', {
      items: profiles.map((p) => mapCobbler(p, userMap[String(p.userId)])),
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    });
  } catch (err) {
    logger.error(`Darkworkstore list cobblers error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

const createCobbler = async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const phoneRaw = String(req.body.phone || '').trim();
    const shopName = String(req.body.shopName || '').trim() || null;
    const shopAddress = String(req.body.shopAddress || '').trim() || null;
    const genderRaw = String(req.body.gender || 'other').trim().toLowerCase();
    const gender = ['male', 'female', 'other'].includes(genderRaw) ? genderRaw : 'other';

    if (!name) {
      return errorResponse(res, 'name is required', 400);
    }
    if (!isValidIndianMobile(phoneRaw)) {
      return errorResponse(res, 'Valid 10-digit Indian mobile is required', 400);
    }

    const mobile = getLocalMobileDigits(phoneRaw);
    const sid = storeId(req);

    const existingUser = await User.findOne({ mobile });
    if (existingUser) {
      const existingProfile = await CobblerProfile.findOne({ userId: existingUser._id }).lean();
      if (existingProfile && String(existingProfile.darkStoreId || '') === sid) {
        return errorResponse(res, 'This cobbler is already on your staff list', 409);
      }
      return errorResponse(res, 'This mobile number is already registered', 409);
    }

    await Role.initializeDefaultRoles();
    const cobblerRole = await Role.findOne({ name: 'COBBER' });
    if (!cobblerRole) {
      return errorResponse(res, 'COBBER role is not configured', 500);
    }

    const dob = req.body.dateOfBirth ? new Date(req.body.dateOfBirth) : new Date('1990-01-01');
    if (Number.isNaN(dob.getTime())) {
      return errorResponse(res, 'Invalid dateOfBirth', 400);
    }

    const user = await User.create({
      mobile,
      name,
      dateOfBirth: dob,
      gender,
      role: cobblerRole._id,
      isPhoneVerified: true,
      isActive: true,
    });

    try {
      const profile = await CobblerProfile.create({
        userId: user._id,
        name,
        phone: mobile,
        shopName,
        shopAddress,
        darkStoreId: sid,
        verificationStatus: 'verified',
        isOnline: true,
        servicesOffered: ['Repair', 'Maintenance', 'Wash'],
      });
      return success(res, 'Cobbler added', { cobbler: mapCobbler(profile, user) }, 201);
    } catch (profileErr) {
      await User.deleteOne({ _id: user._id });
      throw profileErr;
    }
  } catch (err) {
    logger.error(`Darkworkstore create cobbler error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

const deleteCobbler = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid cobbler id', 400);
    }

    const profile = await CobblerProfile.findOne({ _id: id, darkStoreId: storeId(req) });
    if (!profile) {
      return notFound(res, 'Cobbler not found');
    }

    const activeJobs = await ServiceRequest.countDocuments({
      cobblerId: profile.userId,
      status: { $nin: ['completed', 'cancelled'] },
    });
    if (activeJobs > 0) {
      return errorResponse(res, 'Cannot remove a cobbler with active jobs', 400);
    }

    await CobblerProfile.deleteOne({ _id: profile._id });
    await User.updateOne({ _id: profile.userId }, { $set: { isActive: false } });

    return success(res, 'Cobbler removed', { id: String(profile._id) });
  } catch (err) {
    logger.error(`Darkworkstore delete cobbler error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

module.exports = {
  listCobblers,
  createCobbler,
  deleteCobbler,
};
