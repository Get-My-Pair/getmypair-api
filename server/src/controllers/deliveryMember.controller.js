/**
 * Masteradmin CRUD for Delivery member portal accounts + send login email.
 */
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const AdminMaster = require('../models/adminMaster.model');
const config = require('../config/env');
const { success, error: errorResponse } = require('../utils/response');
const logger = require('../utils/logger');
const emailService = require('../services/email.service');
const { uploadToCloudinary } = require('../config/cloudinary');

const SALT_ROUNDS = 12;
const PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
const MEMBER_FILTER = { portal: 'delivery' };

function generatePassword(length = 12) {
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
  return `${config.CLIENT_WEB_URL}/delivery/login`;
}

function maskAadhaar(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length < 4) return digits ? 'XXXX' : '';
  return `XXXX-XXXX-${digits.slice(-4)}`;
}

function pickFields(body = {}) {
  const str = (key) => String(body[key] || '').trim();
  return {
    name: str('name'),
    email: str('email').toLowerCase(),
    phone: str('phone'),
    aadhaarNumber: str('aadhaarNumber').replace(/\s/g, ''),
    notes: str('notes'),
    photoUrl: str('photoUrl'),
    photo: str('photo'),
  };
}

function mapMember(doc, { revealAadhaar = false } = {}) {
  const row = doc && typeof doc.toJSON === 'function' ? doc.toJSON() : { ...doc };
  return {
    id: String(row._id),
    _id: String(row._id),
    name: row.name || '',
    email: row.email || '',
    phone: row.phone || '',
    photoUrl: row.photoUrl || '',
    aadhaarNumber: revealAadhaar ? row.aadhaarNumber || '' : maskAadhaar(row.aadhaarNumber),
    aadhaarMasked: maskAadhaar(row.aadhaarNumber),
    notes: row.notes || '',
    status: row.status || (row.isVerified ? 'verified' : 'pending'),
    isVerified: Boolean(row.isVerified),
    isActive: row.isActive !== false,
    credentialsSentAt: row.verifiedAt || null,
    lastLoginAt: row.lastLoginAt || null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function resolvePhotoUrl(photo, existing = '') {
  const value = String(photo || '').trim();
  if (!value) return existing || '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  if (!value.startsWith('data:image')) return existing || '';
  const base64 = value.split(',')[1];
  if (!base64) return existing || '';
  try {
    const buf = Buffer.from(base64, 'base64');
    const uploaded = await uploadToCloudinary(buf, { folder: 'getmypair/delivery-members' });
    return uploaded.secure_url || existing || '';
  } catch (err) {
    logger.warn(`Delivery member photo upload skipped: ${err.message}`);
    return existing || '';
  }
}

async function sendCredentials(user) {
  const password = generatePassword();
  user.passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  user.isVerified = true;
  user.status = 'verified';
  user.isActive = true;
  user.verifiedAt = new Date();
  await user.save();

  const delivery = await emailService.sendDeliveryMemberCredentials({
    to: user.email,
    name: user.name,
    email: user.email,
    password,
    loginUrl: loginUrl(),
  });
  return { password, delivery };
}

/**
 * GET /api/masteradmin/delivery-members
 * GET /api/darkworkstore/delivery-members
 */
const list = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const skip = (page - 1) * limit;
    const status = String(req.query.status || '').trim().toLowerCase();
    const q = String(req.query.q || '').trim();
    const filter = { ...MEMBER_FILTER };
    if (['pending', 'verified', 'rejected'].includes(status)) filter.status = status;
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      AdminMaster.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      AdminMaster.countDocuments(filter),
    ]);

    return success(res, 'Delivery members', {
      items: items.map((row) => mapMember(row)),
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    });
  } catch (err) {
    logger.error(`List delivery members error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid delivery member id', 400);
    }
    const user = await AdminMaster.findOne({ _id: id, ...MEMBER_FILTER }).lean();
    if (!user) return errorResponse(res, 'Delivery member not found', 404);
    return success(res, 'Delivery member', { user: mapMember(user, { revealAadhaar: true }) });
  } catch (err) {
    logger.error(`Get delivery member error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

const create = async (req, res) => {
  try {
    const fields = pickFields(req.body);
    if (!fields.name) return errorResponse(res, 'name is required', 400);
    if (!fields.email) return errorResponse(res, 'email is required', 400);
    if (!fields.phone) return errorResponse(res, 'phone is required', 400);
    if (fields.aadhaarNumber && !/^\d{12}$/.test(fields.aadhaarNumber)) {
      return errorResponse(res, 'Aadhaar number must be 12 digits', 400);
    }

    const existing = await AdminMaster.findOne({ email: fields.email });
    if (existing) return errorResponse(res, 'An account with this email already exists', 409);

    const photoUrl = await resolvePhotoUrl(fields.photo || fields.photoUrl, '');
    const user = await AdminMaster.create({
      name: fields.name,
      email: fields.email,
      phone: fields.phone,
      aadhaarNumber: fields.aadhaarNumber,
      notes: fields.notes,
      photoUrl,
      portal: 'delivery',
      isActive: true,
      isVerified: false,
      status: 'pending',
      registeredVia: 'masteradmin',
      passwordHash: await unusablePasswordHash(),
    });

    logger.info(`Masteradmin created delivery member: ${user.email}`);
    return success(res, 'Delivery member created', { user: mapMember(user) }, 201);
  } catch (err) {
    if (err.code === 11000) return errorResponse(res, 'An account with this email already exists', 409);
    logger.error(`Create delivery member error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid delivery member id', 400);
    }
    const user = await AdminMaster.findOne({ _id: id, ...MEMBER_FILTER });
    if (!user) return errorResponse(res, 'Delivery member not found', 404);

    const fields = pickFields(req.body);
    if (Object.prototype.hasOwnProperty.call(req.body, 'name')) user.name = fields.name;
    if (Object.prototype.hasOwnProperty.call(req.body, 'phone')) user.phone = fields.phone;
    if (Object.prototype.hasOwnProperty.call(req.body, 'notes')) user.notes = fields.notes;
    if (Object.prototype.hasOwnProperty.call(req.body, 'aadhaarNumber')) {
      if (fields.aadhaarNumber && !/^\d{12}$/.test(fields.aadhaarNumber)) {
        return errorResponse(res, 'Aadhaar number must be 12 digits', 400);
      }
      user.aadhaarNumber = fields.aadhaarNumber;
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'email') && fields.email) {
      const taken = await AdminMaster.findOne({ email: fields.email, _id: { $ne: user._id } });
      if (taken) return errorResponse(res, 'An account with this email already exists', 409);
      user.email = fields.email;
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'isActive')) {
      user.isActive = Boolean(req.body.isActive);
    }
    if (fields.photo || fields.photoUrl) {
      user.photoUrl = await resolvePhotoUrl(fields.photo || fields.photoUrl, user.photoUrl);
    }

    await user.save();
    return success(res, 'Delivery member updated', { user: mapMember(user) });
  } catch (err) {
    logger.error(`Update delivery member error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid delivery member id', 400);
    }
    const deleted = await AdminMaster.findOneAndDelete({ _id: id, ...MEMBER_FILTER });
    if (!deleted) return errorResponse(res, 'Delivery member not found', 404);
    logger.info(`Masteradmin deleted delivery member: ${deleted.email}`);
    return success(res, 'Delivery member deleted', { id });
  } catch (err) {
    logger.error(`Delete delivery member error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

/**
 * PATCH /api/masteradmin/delivery-members/:id/send-email
 * Generate a password and email the Delivery member dashboard login.
 */
const sendEmail = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid delivery member id', 400);
    }
    const user = await AdminMaster.findOne({ _id: id, ...MEMBER_FILTER }).select('+passwordHash');
    if (!user) return errorResponse(res, 'Delivery member not found', 404);

    const { delivery } = await sendCredentials(user);
    if (config.NODE_ENV === 'production' && !delivery.delivered && !config.RETURN_OTP_IN_RESPONSE) {
      return errorResponse(
        res,
        'Login email could not be sent. Check Resend configuration.',
        503
      );
    }

    logger.info(`Delivery member credentials emailed: ${user.email}`);
    return success(res, 'Login details sent to the delivery member email', {
      user: mapMember(user),
      deliveryMode: delivery.mode,
    });
  } catch (err) {
    logger.error(`Send delivery member email error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  sendEmail,
};
