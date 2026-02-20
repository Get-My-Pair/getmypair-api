const User = require('../models/user.model');
const Role = require('../models/role.model');
const AuditLog = require('../models/auditLog.model');
const { getRoleFromAppSource } = require('../config/roles');
const otpService = require('./otp.service');
const tokenService = require('./token.service');
const logger = require('../utils/logger');

/**
 * Register new user - Role is derived from appSource, NEVER from client
 * @param {Object} userData - User registration data
 * @param {String} appSource - App identifier (USER_APP, COBBER_APP, etc.)
 * @returns {Object} User object
 */
const registerUser = async (userData, appSource = 'USER_APP') => {
  try {
    const roleName = getRoleFromAppSource(appSource);

    if (userData.email && !userData.password) {
      throw new Error('Password is required for email registration');
    }

    if (userData.email) {
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        throw new Error('User with this email already exists');
      }
    }
    if (userData.mobile) {
      const existingMobile = await User.findOne({ mobile: userData.mobile });
      if (existingMobile) {
        throw new Error('User with this mobile already exists');
      }
    }

    // Get role from DB
    let role = await Role.findOne({ name: roleName });
    if (!role) {
      await Role.initializeDefaultRoles();
      role = await Role.findOne({ name: roleName });
    }

    // Remove role from userData - backend only assigns role
    const { role: _omitRole, ...safeUserData } = userData;

    const user = new User({
      ...safeUserData,
      role: role._id,
    });

    await user.save();

    await AuditLog.createLog({
      action: 'register',
      resource: 'user',
      status: 'success',
      details: { email: user.email, mobile: user.mobile, userId: user._id, role: roleName },
    });

    return user;
  } catch (error) {
    logger.error(`Error registering user: ${error.message}`);
    throw error;
  }
};

/**
 * Login user
 * @param {String} email - User email
 * @param {String} password - User password
 * @param {String} ipAddress - IP address
 * @param {String} userAgent - User agent
 * @param {String} deviceInfo - Device information
 * @returns {Object} User and tokens
 */
const loginUser = async (email, password, ipAddress, userAgent, deviceInfo) => {
  try {
    // Find user with password field
    const user = await User.findOne({ email })
      .select('+password')
      .populate('role');

    if (!user) {
      await AuditLog.createLog({
        action: 'login',
        resource: 'auth',
        ipAddress,
        userAgent,
        status: 'failure',
        errorMessage: 'User not found',
        details: { email },
      });
      throw new Error('Invalid email or password');
    }

    // Check if account is locked
    if (user.isLocked) {
      await AuditLog.createLog({
        userId: user._id,
        action: 'login',
        resource: 'auth',
        ipAddress,
        userAgent,
        status: 'failure',
        errorMessage: 'Account locked',
        details: { email },
      });
      throw new Error('Account is locked. Please try again later.');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      // Increment login attempts
      await user.incLoginAttempts();

      await AuditLog.createLog({
        userId: user._id,
        action: 'login',
        resource: 'auth',
        ipAddress,
        userAgent,
        status: 'failure',
        errorMessage: 'Invalid password',
        details: { email },
      });

      throw new Error('Invalid email or password');
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      await AuditLog.createLog({
        userId: user._id,
        action: 'login',
        resource: 'auth',
        ipAddress,
        userAgent,
        status: 'failure',
        errorMessage: 'Email not verified',
        details: { email },
      });
      throw new Error('Please verify your email before logging in');
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Create session and generate tokens
    const { accessToken, refreshToken, expiresIn } = await tokenService.createSession(
      user,
      deviceInfo,
      ipAddress,
      userAgent
    );

    // Log successful login
    await AuditLog.createLog({
      userId: user._id,
      action: 'login',
      resource: 'auth',
      ipAddress,
      userAgent,
      status: 'success',
      details: { email },
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
    logger.error(`Error logging in user: ${error.message}`);
    throw error;
  }
};

/**
 * Send OTP for verification
 * @param {String} email - User email
 * @param {String} phone - User phone (optional)
 * @param {String} type - OTP type ('email' or 'phone')
 * @param {String} purpose - OTP purpose
 * @returns {Object} OTP info
 */
const sendOTP = async (email, phone, type, purpose = 'verification') => {
  try {
    // Check rate limit
    const rateLimitExceeded = await otpService.checkRateLimit(email, phone, type);
    if (rateLimitExceeded) {
      throw new Error('Too many OTP requests. Please try again later.');
    }

    // Create OTP
    const { otp, expiresAt } = await otpService.createOTP(email, phone, type, purpose);

    // TODO: Send OTP via email/SMS service
    // For now, log it (in production, use nodemailer or SMS service)
    logger.info(`OTP for ${type === 'email' ? email : phone}: ${otp}`);

    // Log audit event
    await AuditLog.createLog({
      action: 'otp-generate',
      resource: 'otp',
      status: 'success',
      details: { email, phone, type, purpose },
    });

    return {
      expiresIn: Math.floor((expiresAt - new Date()) / 1000), // seconds
    };
  } catch (error) {
    logger.error(`Error sending OTP: ${error.message}`);
    throw error;
  }
};

/**
 * Verify OTP and complete registration
 * @param {String} email - User email
 * @param {String} phone - User phone (optional)
 * @param {String} otp - OTP code
 * @param {String} type - OTP type
 * @returns {Object} Verification result
 */
const verifyOTPAndCompleteRegistration = async (email, phone, otp, type) => {
  try {
    // Verify OTP
    const verification = await otpService.verifyOTP(email, phone, otp, type);

    if (!verification.valid) {
      await AuditLog.createLog({
        action: 'otp-verify',
        resource: 'otp',
        status: 'failure',
        errorMessage: verification.message,
        details: { email, phone, type },
      });
      throw new Error(verification.message);
    }

    // Find user by email or phone
    const query = type === 'email' ? { email } : { $or: [{ mobile: phone }, { phone }] };
    const user = await User.findOne(query).populate('role');

    if (!user) {
      throw new Error('User not found');
    }

    // Update verification status
    if (type === 'email') {
      user.isEmailVerified = true;
    } else if (type === 'phone') {
      user.isPhoneVerified = true;
    }

    await user.save();

    // Create session and generate tokens
    const { accessToken, refreshToken, expiresIn } = await tokenService.createSession(
      user,
      'web',
      '127.0.0.1',
      'unknown'
    );

    // Log audit event
    await AuditLog.createLog({
      userId: user._id,
      action: 'otp-verify',
      resource: 'otp',
      status: 'success',
      details: { email, phone, type },
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
    logger.error(`Error verifying OTP: ${error.message}`);
    throw error;
  }
};

/**
 * Forgot password - send reset OTP
 * @param {String} email - User email
 * @returns {Object} Success message
 */
const forgotPassword = async (email) => {
  try {
    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if user exists for security
      return { message: 'If email exists, password reset OTP has been sent' };
    }

    // Send OTP for password reset
    await sendOTP(email, null, 'email', 'password-reset');

    return { message: 'Password reset OTP sent to your email' };
  } catch (error) {
    logger.error(`Error in forgot password: ${error.message}`);
    throw error;
  }
};

/**
 * Reset password using OTP
 * @param {String} email - User email
 * @param {String} otp - OTP code
 * @param {String} newPassword - New password
 * @returns {Object} Success message
 */
const resetPassword = async (email, otp, newPassword) => {
  try {
    // Verify OTP
    const verification = await otpService.verifyOTP(email, null, otp, 'email');

    if (!verification.valid || verification.otpDoc.purpose !== 'password-reset') {
      throw new Error('Invalid or expired OTP');
    }

    // Find user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      throw new Error('User not found');
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Revoke all sessions
    await tokenService.revokeAllUserSessions(user._id);

    // Log audit event
    await AuditLog.createLog({
      userId: user._id,
      action: 'password-reset',
      resource: 'auth',
      status: 'success',
      details: { email },
    });

    return { message: 'Password reset successful' };
  } catch (error) {
    logger.error(`Error resetting password: ${error.message}`);
    throw error;
  }
};

/**
 * Get current user profile
 * @param {String} userId - User ID
 * @returns {Object} User object
 */
const getCurrentUser = async (userId) => {
  try {
    const user = await User.findById(userId).populate('role');

    if (!user) {
      throw new Error('User not found');
    }

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
  registerUser,
  loginUser,
  sendOTP,
  verifyOTPAndCompleteRegistration,
  verifyMobileOTPAndLoginOrRegister,
  completeMobileRegistration,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  updateProfile,
};
