const User = require('../models/user.model');
const AuditLog = require('../models/auditLog.model');
const { getRoleFromAppSource } = require('../config/roles');
const otpService = require('./otp.service');
const tokenService = require('./token.service');
const logger = require('../utils/logger');

/**
 * Send OTP to mobile number
 * @param {String} mobile - User mobile number
 * @param {String} ipAddress - IP address
 * @param {String} userAgent - User agent
 * @returns {Object} OTP info
 */
const sendOTP = async (mobile, ipAddress, userAgent) => {
  try {
    // Normalize mobile number format (ensure consistency)
    let normalizedMobile = mobile;
    if (mobile && !mobile.startsWith('+')) {
      normalizedMobile = '+91' + mobile; // Default to India +91
    }

    // Check rate limit
    const rateLimitExceeded = await otpService.checkRateLimit(null, normalizedMobile, 'phone');
    if (rateLimitExceeded) {
      await AuditLog.createLog({
        action: 'otp-generate',
        resource: 'otp',
        status: 'failure',
        errorMessage: 'Rate limit exceeded',
        ipAddress,
        userAgent,
        details: { mobile: normalizedMobile, type: 'phone', purpose: 'login' },
      });
      throw new Error('Too many OTP requests. Please try again later.');
    }

    // Create OTP with normalized mobile
    const { otp, expiresAt } = await otpService.createOTP(null, normalizedMobile, 'phone', 'login');

    // TODO: Send OTP via SMS service
    // For now, log it (in production, use SMS service)
    logger.info(`OTP for mobile ${mobile}: ${otp}`);

    // Log audit event
    await AuditLog.createLog({
      action: 'otp-generate',
      resource: 'otp',
      status: 'success',
      ipAddress,
      userAgent,
      details: { mobile: normalizedMobile, type: 'phone', purpose: 'login' },
    });

    return {
      otp, // Return OTP for development mode
      expiresIn: Math.floor((expiresAt - new Date()) / 1000), // seconds
    };
  } catch (error) {
    logger.error(`Error sending OTP: ${error.message}`);
    throw error;
  }
};

/**
 * Verify OTP and check if user exists
 * @param {String} mobile - User mobile number
 * @param {String} otp - OTP code
 * @param {String} ipAddress - IP address
 * @param {String} userAgent - User agent
 * @param {String} deviceInfo - Device information
 * @returns {Object} Verification result with user status
 */
const verifyOTP = async (mobile, otp, ipAddress, userAgent, deviceInfo) => {
  try {
    // Normalize mobile number format (ensure consistency)
    let normalizedMobile = mobile;
    if (mobile && !mobile.startsWith('+')) {
      normalizedMobile = '+91' + mobile; // Default to India +91
    }

    // Verify OTP
    const verification = await otpService.verifyOTP(null, normalizedMobile, otp, 'phone');

    if (!verification.valid) {
      await AuditLog.createLog({
        action: 'otp-verify',
        resource: 'otp',
        status: 'failure',
        errorMessage: verification.message,
        ipAddress,
        userAgent,
        details: { mobile, type: 'phone', attemptsRemaining: verification.attemptsRemaining },
      });
      throw new Error(verification.message);
    }

    // Check if user exists (try both formats)
    let user = await User.findOne({ mobile: normalizedMobile });
    if (!user && mobile !== normalizedMobile) {
      user = await User.findOne({ mobile });
    }

    if (user) {
      // Existing user - Login
      user.isPhoneVerified = true;
      user.lastLogin = new Date();
      await user.save();

      // Create session and generate tokens
      const { accessToken, refreshToken, expiresIn } = await tokenService.createSession(
        user,
        deviceInfo || 'mobile',
        ipAddress || '127.0.0.1',
        userAgent || 'unknown'
      );

      // Log successful login
      await AuditLog.createLog({
        userId: user._id,
        action: 'login',
        resource: 'auth',
        ipAddress,
        userAgent,
        status: 'success',
        details: { mobile },
      });

      return {
        isExistingUser: true,
        user: user.toJSON(),
        tokens: {
          accessToken,
          refreshToken,
          expiresIn,
        },
      };
    } else {
      // New user - Need profile completion
      await AuditLog.createLog({
        action: 'otp-verify',
        resource: 'otp',
        status: 'success',
        ipAddress,
        userAgent,
        details: { mobile, type: 'phone', requiresProfileCompletion: true },
      });

      return {
        isExistingUser: false,
        requiresProfileCompletion: true,
        message: 'Please complete your profile',
      };
    }
  } catch (error) {
    logger.error(`Error verifying OTP: ${error.message}`);
    throw error;
  }
};

/**
 * Complete profile and create user account
 * @param {String} mobile - User mobile number
 * @param {String} name - User name
 * @param {Date} dateOfBirth - User date of birth
 * @param {String} gender - User gender
 * @param {String} ipAddress - IP address
 * @param {String} userAgent - User agent
 * @param {String} deviceInfo - Device information
 * @param {String} appSource - App identifier for role (USER_APP, COBBER_APP, etc.)
 * @param {Object} location - Optional { lat, lng, address }
 * @returns {Object} User and tokens
 */
const completeProfile = async (mobile, name, dateOfBirth, gender, ipAddress, userAgent, deviceInfo, appSource = 'USER_APP', location = null) => {
  try {
    // Role from app source (client sends X-App-Source header; backend sets role)
    let role = 'user';
    try {
      const roleName = getRoleFromAppSource(appSource);
      role = roleName ? roleName.toLowerCase() : 'user';
      if (!['user', 'admin', 'moderator'].includes(role)) role = 'user';
    } catch (_) {
      role = 'user';
    }

    // Normalize mobile number format
    let normalizedMobile = mobile;
    if (mobile && !mobile.startsWith('+')) {
      normalizedMobile = '+91' + mobile; // Default to India +91
    }

    // Check if user already exists (try both formats)
    let existingUser = await User.findOne({ mobile: normalizedMobile });
    if (!existingUser && mobile !== normalizedMobile) {
      existingUser = await User.findOne({ mobile });
    }
    if (existingUser) {
      await AuditLog.createLog({
        action: 'register',
        resource: 'user',
        status: 'failure',
        errorMessage: 'User with this mobile number already exists',
        ipAddress,
        userAgent,
        details: { mobile, name },
      });
      throw new Error('User with this mobile number already exists');
    }

    const userData = {
      mobile: normalizedMobile,
      name,
      dateOfBirth,
      gender,
      role,
      isPhoneVerified: true,
    };
    if (location && typeof location === 'object' && (location.lat != null || location.lng != null || location.address)) {
      userData.location = {
        lat: location.lat,
        lng: location.lng,
        address: location.address,
      };
    }

    const user = new User(userData);

    await user.save();

    // Create session and generate tokens
    const { accessToken, refreshToken, expiresIn } = await tokenService.createSession(
      user,
      deviceInfo || 'mobile',
      ipAddress || '127.0.0.1',
      userAgent || 'unknown'
    );

    // Log audit event
    await AuditLog.createLog({
      userId: user._id,
      action: 'register',
      resource: 'user',
      status: 'success',
      ipAddress,
      userAgent,
      details: { mobile, name, gender, dateOfBirth },
    });

    return {
      user: user.toJSON(),
      tokens: {
        accessToken,
        refreshToken,
        expiresIn,
      },
    };
  } catch (error) {
    logger.error(`Error completing profile: ${error.message}`);
    throw error;
  }
};

/**
 * Get current user profile
 * @param {String} userId - User ID
 * @returns {Object} User object
 */
const getCurrentUser = async (userId, ipAddress, userAgent) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      await AuditLog.createLog({
        userId,
        action: 'profile-update',
        resource: 'user',
        status: 'failure',
        errorMessage: 'User not found',
        ipAddress,
        userAgent,
      });
      throw new Error('User not found');
    }

    // Log profile view
    await AuditLog.createLog({
      userId: user._id,
      action: 'profile-update',
      resource: 'user',
      status: 'success',
      ipAddress,
      userAgent,
      details: { action: 'view_profile' },
    });

    return user.toJSON();
  } catch (error) {
    logger.error(`Error getting current user: ${error.message}`);
    throw error;
  }
};

/**
 * Mobile OTP - Verify and login if user exists, else return profileRequired
 * @param {String} mobile - User mobile number
 * @param {String} otp - OTP code
 * @param {String} appSource - App identifier for role assignment
 * @param {Object} context - ipAddress, userAgent, deviceInfo
 * @returns {Object} { user, tokens } or { profileRequired: true }
 */
const verifyMobileOTPAndLoginOrRegister = async (mobile, otp, appSource, context = {}) => {
  const { ipAddress = '', userAgent = '', deviceInfo = '' } = context;
  const verification = await otpService.verifyOTP(null, mobile, otp, 'phone');
  if (!verification.valid) {
    throw new Error(verification.message || 'Invalid or expired OTP');
  }

  const user = await User.findOne({ mobile }).populate('role');
  if (user) {
    user.isPhoneVerified = true;
    await user.save();
    const { accessToken, refreshToken, expiresIn } = await tokenService.createSession(
      user,
      deviceInfo,
      ipAddress,
      userAgent
    );
    await AuditLog.createLog({
      userId: user._id,
      action: 'login',
      resource: 'auth',
      ipAddress,
      userAgent,
      status: 'success',
      details: { mobile },
    });
    return { user: user.toJSON(), tokens: { accessToken, refreshToken, expiresIn } };
  }

  return { profileRequired: true, verifiedMobile: mobile };
};

/**
 * Complete mobile registration - Create user with profile, role from appSource
 * @param {Object} params - mobile, otp, appSource, profile
 */
const completeMobileRegistration = async (params) => {
  const { mobile, otp, appSource, profile, context = {} } = params;
  const { ipAddress = '', userAgent = '', deviceInfo = '' } = context;

  const verification = await otpService.verifyOTP(null, mobile, otp, 'phone');
  if (!verification.valid) {
    throw new Error(verification.message || 'Invalid or expired OTP');
  }

  const roleName = getRoleFromAppSource(appSource);
  let role = await Role.findOne({ name: roleName });
  if (!role) {
    await Role.initializeDefaultRoles();
    role = await Role.findOne({ name: roleName });
  }

  const user = new User({
    mobile,
    isPhoneVerified: true,
    role: role._id,
    profileCompleted: true,
    ...profile,
  });
  await user.save();

  const { accessToken, refreshToken, expiresIn } = await tokenService.createSession(
    user,
    deviceInfo,
    ipAddress,
    userAgent
  );

  await AuditLog.createLog({
    action: 'register',
    resource: 'user',
    status: 'success',
    details: { mobile, userId: user._id, role: roleName },
  });

  return {
    user: user.toJSON(),
    tokens: { accessToken, refreshToken, expiresIn },
  };
};

/**
 * Update user profile - Location allowed for Flutter
 * Role is NEVER updatable from API
 * @param {String} userId - User ID
 * @param {Object} profileData - firstName, lastName, dateOfBirth, gender, location
 */
const updateProfile = async (userId, profileData) => {
  const allowedFields = ['firstName', 'lastName', 'dateOfBirth', 'gender', 'location'];
  const update = {};
  for (const key of allowedFields) {
    if (profileData[key] !== undefined) {
      update[key] = profileData[key];
    }
  }
  // location: { lat, lng, address }
  if (update.location && typeof update.location !== 'object') {
    delete update.location;
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: update, profileCompleted: true },
    { new: true, runValidators: true }
  )
    .populate('role');

  if (!user) throw new Error('User not found');

  await AuditLog.createLog({
    userId: user._id,
    action: 'profile-update',
    resource: 'user',
    status: 'success',
    details: { updatedFields: Object.keys(update) },
  });

  return user.toJSON();
};

module.exports = {
  sendOTP,
  verifyOTP,
  completeProfile,
  verifyMobileOTPAndLoginOrRegister,
  completeMobileRegistration,
  getCurrentUser,
  updateProfile,
};
