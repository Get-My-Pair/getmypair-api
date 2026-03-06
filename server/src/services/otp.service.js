/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : otp.service.js
 * Description: OTP service – create, verify, rate limit, hash
 * ----------------------------------------------------------------------------
 * Developer  : C Ranjith Kumar
 * LinkedIn         : https://www.linkedin.com/in/coding-ranjith/
 * Personal GitHub  : https://github.com/CodingRanjith
 * Project GitHub   : https://github.com/Ranjithgmp
 * Personal Email   : ranjith.c96me@gmail.com
 * Project Email    : ranjith.kumar@getmypair.com
 * ----------------------------------------------------------------------------
 * Last modified : 2025-03-03
 * ----------------------------------------------------------------------------
 */

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
 * @param {String} purpose - OTP purpose ('verification', 'login')
 * @returns {Object} OTP document
 */
const createOTP = async (email, phone, type, purpose = 'verification') => {
  try {
    // Normalize phone number format for consistency
    let normalizedPhone = phone;
    if (phone && type === 'phone') {
      // Ensure consistent format - if no +, add country code
      if (!phone.startsWith('+')) {
        // Default to India +91 if no country code
        normalizedPhone = '+91' + phone;
      }
    }
    
    // Delete any existing unused OTPs for this email/phone (check both formats)
    let query;
    if (type === 'email') {
      query = { email, isUsed: false };
    } else {
      // Check both normalized and original format
      const phoneFormats = [normalizedPhone];
      if (phone !== normalizedPhone) {
        phoneFormats.push(phone);
      }
      query = { 
        $or: phoneFormats.map(p => ({ phone: p, isUsed: false }))
      };
    }
    await OTP.deleteMany(query);

    // Generate new OTP
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + config.OTP_EXPIRE_MINUTES * 60 * 1000);

    // Create OTP document (will be hashed by pre-save hook)
    const otp = new OTP({
      email: type === 'email' ? email : undefined,
      phone: type === 'phone' ? normalizedPhone : undefined,
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
    // Normalize phone number - try both with and without + prefix
    let query;
    if (type === 'email') {
      query = { email, type };
    } else {
      // Try to find OTP with exact phone match, or try alternative formats
      const phoneVariants = [phone];
      if (phone && !phone.startsWith('+')) {
        phoneVariants.push('+' + phone);
        phoneVariants.push('+91' + phone); // India country code
      } else if (phone && phone.startsWith('+91')) {
        phoneVariants.push(phone.substring(3)); // Remove +91
        phoneVariants.push(phone.substring(1)); // Remove +
      }
      
      query = { 
        type,
        $or: phoneVariants.map(p => ({ phone: p }))
      };
    }
    
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

    // Check attempts (max 3)
    const maxAttempts = config.OTP_MAX_ATTEMPTS ?? 3;
    if (otp.attempts >= maxAttempts) {
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
        attemptsRemaining: Math.max(0, maxAttempts - otp.attempts - 1),
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
