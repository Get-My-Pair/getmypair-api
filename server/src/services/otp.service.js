const OTP = require('../models/otp.model');
const config = require('../config/env');
const logger = require('../utils/logger');

/**
 * Generate OTP
 * @returns {String} 6-digit OTP
 */
const generateOTP = () => {
  // Generate a random numeric OTP
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
 * @param {String} purpose - OTP purpose ('verification', 'password-reset', 'login')
 * @returns {Object} OTP document
 */
const createOTP = async (email, phone, type, purpose = 'verification') => {
  try {
    // Delete any existing unused OTPs for this email/phone
    const query = type === 'email' ? { email, isUsed: false } : { phone, isUsed: false };
    await OTP.deleteMany(query);

    // Generate new OTP
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + config.OTP_EXPIRE_MINUTES * 60 * 1000);

    // Create OTP document (will be hashed by pre-save hook)
    const otp = new OTP({
      email: type === 'email' ? email : undefined,
      phone: type === 'phone' ? phone : undefined,
      otp: otpCode,
      type,
      purpose,
      expiresAt,
    });

    await otp.save();

    // Return plain OTP code for sending (before hashing)
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
    const query = type === 'email' ? { email, type } : { phone, type };
    
    const otp = await OTP.findOne({
      ...query,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otp) {
      return {
        valid: false,
        message: 'OTP not found or expired',
      };
    }

    // Check attempts
    if (otp.attempts >= 5) {
      return {
        valid: false,
        message: 'Maximum verification attempts exceeded',
      };
    }

    // Verify OTP
    const isValid = await otp.compareOTP(otpCode);

    if (!isValid) {
      await otp.incrementAttempts();
      return {
        valid: false,
        message: 'Invalid OTP',
        attemptsRemaining: 5 - otp.attempts - 1,
      };
    }

    // Mark OTP as used
    await otp.markAsUsed();

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
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const query = type === 'email' ? { email, type } : { phone, type };
    
    const recentOTPs = await OTP.countDocuments({
      ...query,
      createdAt: { $gte: oneHourAgo },
    });

    return recentOTPs >= 5; // Max 5 OTPs per hour
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
