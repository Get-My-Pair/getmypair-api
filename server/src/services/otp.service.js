const OTP = require('../models/otp.model');
const config = require('../config/env');
const logger = require('../utils/logger');

const generateOTP = (length = config.otpLength) => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};

const createOTP = async (identifier, type) => {
  try {
    // Invalidate any existing unused OTPs for this identifier
    await OTP.updateMany(
      { identifier, type, isUsed: false },
      { isUsed: true }
    );

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + config.otpExpiresIn * 1000);

    const otpDoc = await OTP.create({
      identifier,
      otp,
      type,
      expiresAt,
    });

    logger.info(`OTP created for ${identifier}, type: ${type}`);
    return otpDoc;
  } catch (error) {
    logger.error('Error creating OTP:', error);
    throw error;
  }
};

const verifyOTP = async (identifier, otp, type) => {
  try {
    const otpDoc = await OTP.findOne({
      identifier,
      type,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otpDoc) {
      return { valid: false, message: 'OTP not found or expired' };
    }

    if (otpDoc.attempts >= 5) {
      return { valid: false, message: 'Maximum verification attempts exceeded' };
    }

    if (otpDoc.otp !== otp) {
      otpDoc.attempts += 1;
      await otpDoc.save();
      return { valid: false, message: 'Invalid OTP' };
    }

    // Mark OTP as used
    otpDoc.isUsed = true;
    await otpDoc.save();

    logger.info(`OTP verified for ${identifier}, type: ${type}`);
    return { valid: true, message: 'OTP verified successfully' };
  } catch (error) {
    logger.error('Error verifying OTP:', error);
    throw error;
  }
};

const deleteExpiredOTPs = async () => {
  try {
    const result = await OTP.deleteMany({
      expiresAt: { $lt: new Date() },
    });
    logger.info(`Deleted ${result.deletedCount} expired OTPs`);
    return result;
  } catch (error) {
    logger.error('Error deleting expired OTPs:', error);
    throw error;
  }
};

module.exports = {
  generateOTP,
  createOTP,
  verifyOTP,
  deleteExpiredOTPs,
};
