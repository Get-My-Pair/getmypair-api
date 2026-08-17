/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : otp.service.js
 * Description: OTP service – create, verify, rate limit, lockout
 * ----------------------------------------------------------------------------
 * Developer  : C Ranjith Kumar
 * LinkedIn         : https://www.linkedin.com/in/coding-ranjith/
 * Personal GitHub  : https://github.com/CodingRanjith
 * Project GitHub   : https://github.com/Ranjithgmp
 * Personal Email   : ranjith.c96me@gmail.com
 * Project Email    : ranjith.kumar@getmypair.com
 * ----------------------------------------------------------------------------
 * Last modified : 2026-08-17
 * ----------------------------------------------------------------------------
 */

const OTP = require('../models/otp.model');
const OtpLockout = require('../models/otpLockout.model');
const config = require('../config/env');
const logger = require('../utils/logger');

const OTP_SEND_WINDOW_MS = 15 * 60 * 1000;
const OTP_SEND_MAX = 5;
const VERIFY_WINDOW_MS = 15 * 60 * 1000;

const normalizePhone = (phone) => {
  if (!phone) return phone;
  if (!phone.startsWith('+')) {
    return '+91' + phone;
  }
  return phone;
};

/**
 * Generate OTP
 * @returns {String} 6-digit OTP
 */
const generateOTP = () => {
  const min = Math.pow(10, config.OTP_LENGTH - 1);
  const max = Math.pow(10, config.OTP_LENGTH) - 1;
  const numericOTP = Math.floor(Math.random() * (max - min + 1) + min).toString();
  return numericOTP;
};

/**
 * Create and save OTP
 * @param {String} email - User email
 * @param {String} phone - User phone (optional)
 * @param {String} type - OTP type ('email' or 'phone')
 * @param {String} purpose - OTP purpose ('verification', 'login')
 * @returns {Object} OTP document
 */
const createOTP = async (email, phone, type, purpose = 'verification') => {
  try {
    let normalizedPhone = phone;
    if (phone && type === 'phone') {
      if (!phone.startsWith('+')) {
        normalizedPhone = '+91' + phone;
      }
    }

    // Invalidate unused OTPs but keep records so send-OTP rate limits still count
    let query;
    if (type === 'email') {
      query = { email, isUsed: false };
    } else {
      const phoneFormats = [normalizedPhone];
      if (phone !== normalizedPhone) {
        phoneFormats.push(phone);
      }
      query = {
        $or: phoneFormats.map((p) => ({ phone: p, isUsed: false })),
      };
    }
    await OTP.updateMany(query, { $set: { isUsed: true } });

    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + config.OTP_EXPIRE_MINUTES * 60 * 1000);

    const otp = new OTP({
      email: type === 'email' ? email : undefined,
      phone: type === 'phone' ? normalizedPhone : undefined,
      otp: otpCode,
      type,
      purpose,
      expiresAt,
    });

    await otp.save();

    return {
      otp: otpCode,
      expiresAt,
      otpDoc: otp,
    };
  } catch (error) {
    logger.error(`Error creating OTP: ${error.message}`);
    throw error;
  }
};

const lockoutIdentifier = (email, phone, type) =>
  type === 'email' ? `email:${email}` : `phone:${normalizePhone(phone)}`;

const getLockoutStatus = async (identifier) => {
  const rec = await OtpLockout.findOne({ identifier });
  if (!rec) {
    return { locked: false, rec: null };
  }
  if (rec.lockedUntil && rec.lockedUntil > new Date()) {
    return { locked: true, rec };
  }
  return { locked: false, rec };
};

const recordFailedVerifyAttempt = async (identifier) => {
  const maxAttempts = config.MAX_LOGIN_ATTEMPTS || 5;
  const lockMinutes = config.LOCKOUT_DURATION_MINUTES || 30;
  const now = new Date();

  let rec = await OtpLockout.findOne({ identifier });
  if (!rec) {
    rec = await OtpLockout.create({
      identifier,
      failedAttempts: 1,
      windowStartedAt: now,
    });
  } else {
    const windowExpired =
      !rec.windowStartedAt || now - rec.windowStartedAt > VERIFY_WINDOW_MS;
    const lockExpired = rec.lockedUntil && rec.lockedUntil <= now;

    if (windowExpired || lockExpired) {
      rec.failedAttempts = 1;
      rec.windowStartedAt = now;
      rec.lockedUntil = null;
    } else {
      rec.failedAttempts += 1;
    }
    await rec.save();
  }

  if (rec.failedAttempts >= maxAttempts) {
    rec.lockedUntil = new Date(now.getTime() + lockMinutes * 60 * 1000);
    await rec.save();
    return { locked: true, rec };
  }

  return { locked: false, rec };
};

const resetLockout = async (identifier) => {
  await OtpLockout.deleteOne({ identifier });
};

/**
 * Verify OTP
 * @param {String} email - User email
 * @param {String} phone - User phone (optional)
 * @param {String} otpCode - OTP code to verify
 * @param {String} type - OTP type ('email' or 'phone')
 * @returns {Object} Verification result
 */
const verifyOTP = async (email, phone, otpCode, type) => {
  try {
    const identifier = lockoutIdentifier(email, phone, type);
    const lockStatus = await getLockoutStatus(identifier);
    if (lockStatus.locked) {
      return {
        valid: false,
        locked: true,
        statusCode: 429,
        message: 'Too many failed OTP verification attempts. Account locked. Please try again later.',
      };
    }

    let query;
    if (type === 'email') {
      query = { email, type };
    } else {
      const phoneVariants = [phone];
      if (phone && !phone.startsWith('+')) {
        phoneVariants.push('+' + phone);
        phoneVariants.push('+91' + phone);
      } else if (phone && phone.startsWith('+91')) {
        phoneVariants.push(phone.substring(3));
        phoneVariants.push(phone.substring(1));
      }

      query = {
        type,
        $or: phoneVariants.map((p) => ({ phone: p })),
      };
    }

    const otp = await OTP.findOne({
      ...query,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otp) {
      const afterFail = await recordFailedVerifyAttempt(identifier);
      if (afterFail.locked) {
        return {
          valid: false,
          locked: true,
          statusCode: 429,
          message: 'Too many failed OTP verification attempts. Account locked. Please try again later.',
        };
      }
      return {
        valid: false,
        statusCode: 400,
        message: 'OTP not found or expired',
      };
    }

    const maxAttempts = config.OTP_MAX_ATTEMPTS ?? 3;
    if (otp.attempts >= maxAttempts) {
      return {
        valid: false,
        locked: true,
        statusCode: 429,
        message: 'Maximum verification attempts exceeded. Account locked.',
      };
    }

    const isValid = await otp.compareOTP(otpCode);

    if (!isValid) {
      await otp.incrementAttempts();
      const afterFail = await recordFailedVerifyAttempt(identifier);
      const attemptsRemaining = Math.max(0, maxAttempts - otp.attempts);
      if (otp.attempts >= maxAttempts || afterFail.locked) {
        return {
          valid: false,
          locked: true,
          statusCode: 429,
          message: 'Too many failed OTP verification attempts. Account locked. Please try again later.',
          attemptsRemaining: 0,
        };
      }
      return {
        valid: false,
        statusCode: 400,
        message: 'Invalid OTP',
        attemptsRemaining,
      };
    }

    await otp.markAsUsed();
    await resetLockout(identifier);

    return {
      valid: true,
      message: 'OTP verified successfully',
      otpDoc: otp,
    };
  } catch (error) {
    logger.error(`Error verifying OTP: ${error.message}`);
    throw error;
  }
};

/**
 * Check OTP rate limit
 * @param {String} email - User email
 * @param {String} phone - User phone (optional)
 * @param {String} type - OTP type ('email' or 'phone')
 * @returns {Boolean} Whether rate limit is exceeded
 */
const checkRateLimit = async (email, phone, type) => {
  try {
    const windowStart = new Date(Date.now() - OTP_SEND_WINDOW_MS);
    let query;
    if (type === 'email') {
      query = { email, type };
    } else {
      const normalized = normalizePhone(phone);
      const phoneFormats = [normalized];
      if (phone && phone !== normalized) {
        phoneFormats.push(phone);
      }
      query = { type, phone: { $in: phoneFormats } };
    }

    const recentOTPs = await OTP.countDocuments({
      ...query,
      createdAt: { $gte: windowStart },
    });

    return recentOTPs >= OTP_SEND_MAX;
  } catch (error) {
    logger.error(`Error checking OTP rate limit: ${error.message}`);
    return false;
  }
};

module.exports = {
  generateOTP,
  createOTP,
  verifyOTP,
  checkRateLimit,
};
