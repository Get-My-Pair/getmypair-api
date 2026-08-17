/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : darkworkstoreUser.controller.js
 * Description: Public Darkworkstore registration + Masteradmin CRUD / verify
 * ----------------------------------------------------------------------------
 */

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const AdminMaster = require('../models/adminMaster.model');
const config = require('../config/env');
const { success, error: errorResponse } = require('../utils/response');
const logger = require('../utils/logger');
const emailService = require('../services/email.service');

const SALT_ROUNDS = 12;
const PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';

const STORE_FILTER = { portal: 'darkworkstore' };

function generateStorePassword(length = 12) {
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += PASSWORD_ALPHABET[bytes[i] % PASSWORD_ALPHABET.length];
  }
  return out;
}

async function unusablePasswordHash() {
  return bcrypt.hash(crypto.randomBytes(32).toString('hex'), SALT_ROUNDS);
}

function loginUrl() {
  return `${config.CLIENT_WEB_URL}/darkworkstore/login`;
}

function pickStoreFields(body = {}) {
  const str = (key) => String(body[key] || '').trim();
  return {
    name: str('name'),
    email: str('email').toLowerCase(),
    phone: str('phone'),
    storeName: str('storeName'),
    address: str('address'),
    city: str('city'),
    state: str('state'),
    pincode: str('pincode'),
    notes: str('notes'),
  };
}

function mapStoreUser(doc) {
  const row = doc && typeof doc.toJSON === 'function' ? doc.toJSON() : { ...doc };
  return {
    id: String(row._id),
    _id: String(row._id),
    name: row.name || '',
    email: row.email || '',
    phone: row.phone || '',
    storeName: row.storeName || '',
    address: row.address || '',
    city: row.city || '',
    state: row.state || '',
    pincode: row.pincode || '',
    notes: row.notes || '',
    status: row.status || (row.isVerified ? 'verified' : 'pending'),
    isVerified: Boolean(row.isVerified),
    isActive: row.isActive !== false,
    registeredVia: row.registeredVia || 'self',
    verifiedAt: row.verifiedAt || null,
    lastLoginAt: row.lastLoginAt || null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function applyVerification(user, verifierId) {
  const password = generateStorePassword();
  user.passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  user.isVerified = true;
  user.status = 'verified';
  user.isActive = true;
  user.verifiedAt = new Date();
  if (verifierId) {
    user.verifiedBy = verifierId;
  }
  await user.save();

  const delivery = await emailService.sendDarkworkstoreCredentials({
    to: user.email,
    name: user.name,
    storeName: user.storeName,
    email: user.email,
    password,
    loginUrl: loginUrl(),
  });

  return { password, delivery };
}

/**
 * POST /api/darkworkstore/auth/register
 * Public store signup. Account stays pending until Masteradmin verifies.
 */
const register = async (req, res) => {
  try {
    const fields = pickStoreFields(req.body);
    if (!fields.name) {
      return errorResponse(res, 'name is required', 400);
    }
    if (!fields.email) {
      return errorResponse(res, 'email is required', 400);
    }
    if (!fields.storeName) {
      return errorResponse(res, 'storeName is required', 400);
    }
    if (!fields.phone) {
      return errorResponse(res, 'phone is required', 400);
    }

    const existing = await AdminMaster.findOne({ email: fields.email });
    if (existing) {
      if (existing.portal === 'darkworkstore' && existing.status === 'pending') {
        return errorResponse(
          res,
          'This email is already registered and waiting for verification.',
          409
        );
      }
      return errorResponse(res, 'An account with this email already exists', 409);
    }

    const user = await AdminMaster.create({
      ...fields,
      portal: 'darkworkstore',
      isActive: true,
      isVerified: false,
      status: 'pending',
      registeredVia: 'self',
      passwordHash: await unusablePasswordHash(),
    });

    const delivery = await emailService.sendDarkworkstoreRegistrationReceived({
      to: user.email,
      name: user.name,
      storeName: user.storeName,
    });

    logger.info(`Darkworkstore registration received: ${user.email}`);

    return success(
      res,
      'Thank you for registering. Our team will verify your account shortly.',
      {
        user: mapStoreUser(user),
        deliveryMode: delivery.mode,
      },
      201
    );
  } catch (err) {
    if (err.code === 11000) {
      return errorResponse(res, 'An account with this email already exists', 409);
    }
    logger.error(`Darkworkstore register error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

/**
 * GET /api/masteradmin/darkworkstore-users
 */
const list = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const skip = (page - 1) * limit;
    const status = String(req.query.status || '').trim().toLowerCase();
    const filter = { ...STORE_FILTER };
    if (['pending', 'verified', 'rejected'].includes(status)) {
      filter.status = status;
    }

    const [items, total] = await Promise.all([
      AdminMaster.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      AdminMaster.countDocuments(filter),
    ]);

    return success(res, 'Darkworkstore users', {
      items: items.map(mapStoreUser),
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    });
  } catch (err) {
    logger.error(`List Darkworkstore users error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

/**
 * GET /api/masteradmin/darkworkstore-users/:id
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid Darkworkstore user id', 400);
    }

    const user = await AdminMaster.findOne({ _id: id, ...STORE_FILTER }).lean();
    if (!user) {
      return errorResponse(res, 'Darkworkstore user not found', 404);
    }

    return success(res, 'Darkworkstore user', { user: mapStoreUser(user) });
  } catch (err) {
    logger.error(`Get Darkworkstore user error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

/**
 * POST /api/masteradmin/darkworkstore-users
 */
const create = async (req, res) => {
  try {
    const fields = pickStoreFields(req.body);
    if (!fields.name) {
      return errorResponse(res, 'name is required', 400);
    }
    if (!fields.email) {
      return errorResponse(res, 'email is required', 400);
    }
    if (!fields.storeName) {
      return errorResponse(res, 'storeName is required', 400);
    }
    if (!fields.phone) {
      return errorResponse(res, 'phone is required', 400);
    }

    const existing = await AdminMaster.findOne({ email: fields.email });
    if (existing) {
      return errorResponse(res, 'An account with this email already exists', 409);
    }

    const user = await AdminMaster.create({
      ...fields,
      portal: 'darkworkstore',
      isActive: true,
      isVerified: false,
      status: 'pending',
      registeredVia: 'masteradmin',
      passwordHash: await unusablePasswordHash(),
    });

    logger.info(`Masteradmin created Darkworkstore user: ${user.email}`);

    return success(res, 'Darkworkstore user created', { user: mapStoreUser(user) }, 201);
  } catch (err) {
    if (err.code === 11000) {
      return errorResponse(res, 'An account with this email already exists', 409);
    }
    logger.error(`Create Darkworkstore user error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

/**
 * PATCH /api/masteradmin/darkworkstore-users/:id
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid Darkworkstore user id', 400);
    }

    const user = await AdminMaster.findOne({ _id: id, ...STORE_FILTER });
    if (!user) {
      return errorResponse(res, 'Darkworkstore user not found', 404);
    }

    const fields = pickStoreFields(req.body);
    const assignable = ['name', 'phone', 'storeName', 'address', 'city', 'state', 'pincode', 'notes'];
    for (const key of assignable) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        user[key] = fields[key];
      }
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'email') && fields.email) {
      const taken = await AdminMaster.findOne({
        email: fields.email,
        _id: { $ne: user._id },
      });
      if (taken) {
        return errorResponse(res, 'An account with this email already exists', 409);
      }
      user.email = fields.email;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'isActive')) {
      user.isActive = Boolean(req.body.isActive);
    }

    await user.save();
    return success(res, 'Darkworkstore user updated', { user: mapStoreUser(user) });
  } catch (err) {
    logger.error(`Update Darkworkstore user error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

/**
 * DELETE /api/masteradmin/darkworkstore-users/:id
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid Darkworkstore user id', 400);
    }

    const deleted = await AdminMaster.findOneAndDelete({ _id: id, ...STORE_FILTER });
    if (!deleted) {
      return errorResponse(res, 'Darkworkstore user not found', 404);
    }

    logger.info(`Masteradmin deleted Darkworkstore user: ${deleted.email}`);
    return success(res, 'Darkworkstore user deleted', { id });
  } catch (err) {
    logger.error(`Delete Darkworkstore user error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

/**
 * PATCH /api/masteradmin/darkworkstore-users/:id/verify
 * Verify a pending store and email a random password + login link.
 * If already verified, regenerates credentials and resends the email.
 */
const verify = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid Darkworkstore user id', 400);
    }

    const user = await AdminMaster.findOne({ _id: id, ...STORE_FILTER }).select('+passwordHash');
    if (!user) {
      return errorResponse(res, 'Darkworkstore user not found', 404);
    }

    const wasVerified = Boolean(user.isVerified && user.status === 'verified');
    const { delivery } = await applyVerification(user, req.adminMaster?._id);

    if (
      config.NODE_ENV === 'production' &&
      !delivery.delivered &&
      !config.RETURN_OTP_IN_RESPONSE
    ) {
      return errorResponse(
        res,
        'Account verified but the login email could not be sent. Check Resend configuration.',
        503
      );
    }

    logger.info(
      `Darkworkstore user ${wasVerified ? 'credentials resent' : 'verified'}: ${user.email}`
    );

    return success(
      res,
      wasVerified
        ? 'Login details resent to the Darkworkstore user'
        : 'Darkworkstore user verified. Login details sent by email.',
      {
        user: mapStoreUser(user),
        deliveryMode: delivery.mode,
      }
    );
  } catch (err) {
    logger.error(`Verify Darkworkstore user error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

module.exports = {
  register,
  list,
  getById,
  create,
  update,
  remove,
  verify,
};
