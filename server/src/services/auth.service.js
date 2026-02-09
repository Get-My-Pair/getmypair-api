const User = require('../models/user.model');
const Role = require('../models/role.model');
const AuditLog = require('../models/auditLog.model');
const otpService = require('./otp.service');
const tokenService = require('./token.service');
const logger = require('../utils/logger');

/**
 * Register new user
 * @param {Object} userData - User registration data
 * @returns {Object} User object
 */
const registerUser = async (userData) => {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Get default role
    let role = await Role.findOne({ name: 'user' });
    if (!role) {
      // Initialize default roles if not exists
      await Role.initializeDefaultRoles();
      role = await Role.findOne({ name: 'user' });
    }

    // Create user
    const user = new User({
      ...userData,
      role: role._id,
    });

    await user.save();

    // Log audit event
    await AuditLog.createLog({
      action: 'register',
      resource: 'user',
      status: 'success',
      details: { email: user.email, userId: user._id },
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

    // Find user
    const user = await User.findOne({ email }).populate('role');

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

module.exports = {
  registerUser,
  loginUser,
  sendOTP,
  verifyOTPAndCompleteRegistration,
  forgotPassword,
  resetPassword,
  getCurrentUser,
};
