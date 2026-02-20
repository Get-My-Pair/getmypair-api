const authService = require('../services/auth.service');
const { success, error: errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

/**
<<<<<<< HEAD
 * Register new user
 * Role is derived from X-App-Source header - client cannot send role
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;
    const appSource = req.get('X-App-Source') || req.body.appSource || 'USER_APP';

    const user = await authService.registerUser(
      { email, password, firstName, lastName, phone },
      appSource
    );

    // Send OTP for email verification
    await authService.sendOTP(email, phone, 'email', 'verification');

    return success(
      res,
      'Registration successful. Please verify your email.',
      {
        userId: user._id,
        email: user.email,
        otpSent: true,
      },
      201
    );
  } catch (err) {
    logger.error(`Register error: ${err.message}`);
    return errorResponse(res, err.message, 400);
  }
};

/**
 * Send OTP
=======
 * Send OTP to mobile number
>>>>>>> 87393ab8441ae77f9658bd8e2f32b2026e3272ac
 * POST /api/auth/send-otp
 */
const sendOTP = async (req, res) => {
  try {
    const { mobile } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent') || 'unknown';

    const result = await authService.sendOTP(mobile, ipAddress, userAgent);
    const config = require('../config/env');

    // In development mode, include OTP in response for testing
    const responseData = {
      expiresIn: result.expiresIn,
    };
    
    if (config.NODE_ENV === 'development' && result.otp) {
      responseData.otp = result.otp; // Include OTP in development only
    }

    return success(res, 'OTP sent successfully', responseData);
  } catch (err) {
    const AuditLog = require('../models/auditLog.model');
    // Log failed OTP send attempt
    await AuditLog.createLog({
      action: 'otp-generate',
      resource: 'otp',
      status: 'failure',
      errorMessage: err.message,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent') || 'unknown',
      details: { mobile: req.body.mobile },
    });
    logger.error(`Send OTP error: ${err.message}`);
    return errorResponse(res, err.message, 400);
  }
};

/**
 * Verify OTP and check if user exists
 * POST /api/auth/verify-otp
 */
const verifyOTP = async (req, res) => {
  try {
    const { mobile, otp } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent') || 'unknown';
    const deviceInfo = req.get('device-info') || 'mobile';

<<<<<<< HEAD
    const User = require('../models/user.model');
    const user = type === 'email'
      ? await User.findOne({ email })
      : await User.findOne({ $or: [{ mobile: phone }, { phone }] });

    if (user && ((type === 'email' && !user.isEmailVerified) || (type === 'phone' && !user.isPhoneVerified))) {
      // Complete registration
      const result = await authService.verifyOTPAndCompleteRegistration(
        email,
        phone,
        otp,
        type
      );

      return success(res, 'OTP verified successfully. Registration completed.', {
        verified: true,
=======
    const result = await authService.verifyOTP(mobile, otp, ipAddress, userAgent, deviceInfo);

    if (result.isExistingUser) {
      // Existing user - Login successful
      return success(res, 'Login successful', {
>>>>>>> 87393ab8441ae77f9658bd8e2f32b2026e3272ac
        user: result.user,
        tokens: result.tokens,
      });
    } else {
      // New user - Profile completion required
      return success(res, result.message, {
        requiresProfileCompletion: true,
        mobile: mobile,
      });
    }
  } catch (err) {
    const AuditLog = require('../models/auditLog.model');
    // Log failed OTP verification attempt (if not already logged in service)
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent') || 'unknown';
    await AuditLog.createLog({
      action: 'otp-verify',
      resource: 'otp',
      status: 'failure',
      errorMessage: err.message,
      ipAddress,
      userAgent,
      details: { mobile: req.body.mobile },
    });
    logger.error(`Verify OTP error: ${err.message}`);
    return errorResponse(res, err.message, 400);
  }
};

/**
 * Complete profile and create user account
 * POST /api/auth/complete-profile
 */
const completeProfile = async (req, res) => {
  try {
    const { mobile, name, dateOfBirth, gender } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent') || 'unknown';
    const deviceInfo = req.get('device-info') || 'mobile';

    // Log received data for debugging
    logger.info(`Complete profile request: mobile=${mobile}, name=${name}, dateOfBirth=${dateOfBirth}, gender=${gender}`);
    logger.info(`Request body: ${JSON.stringify(req.body)}`);

    const result = await authService.completeProfile(
      mobile,
      name,
      dateOfBirth,
      gender,
      ipAddress,
      userAgent,
      deviceInfo
    );

    return success(res, 'Profile completed successfully. Login successful.', {
      user: result.user,
      tokens: result.tokens,
    }, 201);
  } catch (err) {
    const AuditLog = require('../models/auditLog.model');
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent') || 'unknown';
    // Log failed profile completion (if not already logged in service)
    await AuditLog.createLog({
      action: 'register',
      resource: 'user',
      status: 'failure',
      errorMessage: err.message,
      ipAddress,
      userAgent,
      details: { mobile: req.body.mobile, name: req.body.name },
    });
    logger.error(`Complete profile error: ${err.message}`);
    logger.error(`Request body: ${JSON.stringify(req.body)}`);
    return errorResponse(res, err.message, 400);
  }
};

/**
 * Refresh access token
 * POST /api/auth/refresh-token
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent') || 'unknown';

    const tokenService = require('../services/token.service');
    const AuditLog = require('../models/auditLog.model');
    
    const result = await tokenService.refreshAccessToken(refreshToken);

    // Log token refresh
    await AuditLog.createLog({
      userId: result.userId,
      action: 'token-refresh',
      resource: 'session',
      status: 'success',
      ipAddress,
      userAgent,
    });

    return success(res, 'Token refreshed successfully', {
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
    });
  } catch (err) {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent') || 'unknown';
    const AuditLog = require('../models/auditLog.model');
    
    // Log failed token refresh
    await AuditLog.createLog({
      action: 'token-refresh',
      resource: 'session',
      status: 'failure',
      errorMessage: err.message,
      ipAddress,
      userAgent,
    });
    
    logger.error(`Refresh token error: ${err.message}`);
    return errorResponse(res, err.message, 401);
  }
};

/**
 * Logout user
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent') || 'unknown';
    const userId = req.user?._id;

    const tokenService = require('../services/token.service');
    const AuditLog = require('../models/auditLog.model');

    if (refreshToken) {
      await tokenService.revokeSession(refreshToken);
    }

    // Log logout
    await AuditLog.createLog({
      userId,
      action: 'logout',
      resource: 'auth',
      status: 'success',
      ipAddress,
      userAgent,
    });

    return success(res, 'Logout successful');
  } catch (err) {
    logger.error(`Logout error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
const getCurrentUser = async (req, res) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent') || 'unknown';
    
    const user = await authService.getCurrentUser(req.user._id, ipAddress, userAgent);

    return success(res, 'User retrieved successfully', {
      user,
    });
  } catch (err) {
    logger.error(`Get current user error: ${err.message}`);
    return errorResponse(res, err.message, 404);
  }
};

<<<<<<< HEAD
/**
 * Forgot password
 * POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const result = await authService.forgotPassword(email);

    return success(res, result.message);
  } catch (err) {
    logger.error(`Forgot password error: ${err.message}`);
    return errorResponse(res, err.message, 400);
  }
};

/**
 * Reset password
 * POST /api/auth/reset-password
 */
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const result = await authService.resetPassword(email, otp, newPassword);

    return success(res, result.message);
  } catch (err) {
    logger.error(`Reset password error: ${err.message}`);
    return errorResponse(res, err.message, 400);
  }
};

/**
 * Verify mobile OTP - Login if exists, else return profileRequired
 * POST /api/auth/verify-mobile-otp
 */
const verifyMobileOTP = async (req, res) => {
  try {
    const { mobile, otp, appSource } = req.body;
    const ipAddress = req.ip || req.connection?.remoteAddress || '';
    const userAgent = req.get('user-agent') || '';
    const deviceInfo = req.get('device-info') || '';

    const result = await authService.verifyMobileOTPAndLoginOrRegister(
      mobile,
      otp,
      appSource || 'USER_APP',
      { ipAddress, userAgent, deviceInfo }
    );

    if (result.profileRequired) {
      return success(res, 'Profile required to complete registration', {
        profileRequired: true,
        verifiedMobile: result.verifiedMobile,
      });
    }

    return success(res, 'Login successful', {
      user: result.user,
      tokens: result.tokens,
    });
  } catch (err) {
    logger.error(`Verify mobile OTP error: ${err.message}`);
    return errorResponse(res, err.message, 400);
  }
};

/**
 * Complete mobile registration with profile
 * POST /api/auth/complete-mobile-registration
 */
const completeMobileRegistration = async (req, res) => {
  try {
    const { mobile, otp, appSource, firstName, lastName, dateOfBirth, gender, location } = req.body;
    const ipAddress = req.ip || req.connection?.remoteAddress || '';
    const userAgent = req.get('user-agent') || '';
    const deviceInfo = req.get('device-info') || '';

    const result = await authService.completeMobileRegistration({
      mobile,
      otp,
      appSource: appSource || 'USER_APP',
      profile: { firstName, lastName, dateOfBirth, gender, location },
      context: { ipAddress, userAgent, deviceInfo },
    });

    return success(res, 'Registration completed successfully', {
      user: result.user,
      tokens: result.tokens,
    }, 201);
  } catch (err) {
    logger.error(`Complete mobile registration error: ${err.message}`);
    return errorResponse(res, err.message, 400);
  }
};

/**
 * Update profile - Location allowed for Flutter
 * PUT /api/auth/profile
 */
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, dateOfBirth, gender, location } = req.body;

    const user = await authService.updateProfile(req.user._id, {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      location,
    });

    return success(res, 'Profile updated successfully', { user });
  } catch (err) {
    logger.error(`Update profile error: ${err.message}`);
    return errorResponse(res, err.message, 400);
  }
};

=======
>>>>>>> 87393ab8441ae77f9658bd8e2f32b2026e3272ac
module.exports = {
  sendOTP,
  verifyOTP,
  completeProfile,
  refreshToken,
  logout,
  getCurrentUser,
<<<<<<< HEAD
  forgotPassword,
  resetPassword,
  verifyMobileOTP,
  completeMobileRegistration,
  updateProfile,
=======
>>>>>>> 87393ab8441ae77f9658bd8e2f32b2026e3272ac
};
