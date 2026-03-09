/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : auth.controller.js
 * Description: Auth endpoints – send OTP, verify OTP, complete profile, refresh, logout, me
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

const authService = require('../services/auth.service');
const { success, error: errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Send OTP to mobile number
 * POST /api/auth/send-otp
 */
const sendOTP = async (req, res) => {
  try {
    const { mobile } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent') || 'unknown';

    const result = await authService.sendOTP(mobile, ipAddress, userAgent);
    const config = require('../config/env');

    const responseData = {
      expiresIn: result.expiresIn,
    };

    // Include OTP in response when: development mode OR RETURN_OTP_IN_RESPONSE=true (for app popup / testing)
    const includeOtp = (config.NODE_ENV === 'development' || config.RETURN_OTP_IN_RESPONSE) && result.otp;
    if (includeOtp) {
      responseData.otp = result.otp;
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

    const result = await authService.verifyOTP(mobile, otp, ipAddress, userAgent, deviceInfo);

    if (result.isExistingUser) {
      // Existing user - Login successful
      return success(res, 'Login successful', {
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
 * Headers: X-App-Source (USER_APP, COBBER_APP, etc.), X-App-Version (optional)
 * Body may include optional location: { lat, lng, address }
 */
const completeProfile = async (req, res) => {
  try {
    const { mobile, name, dateOfBirth, gender, location } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent') || 'unknown';
    const deviceInfo = req.get('device-info') || 'mobile';
    const appSource = req.get('X-App-Source') || 'USER_APP';
    const appVersion = req.get('X-App-Version') || '';

    logger.info(`Complete profile: mobile=${mobile}, appSource=${appSource}, appVersion=${appVersion}`);

    const result = await authService.completeProfile(
      mobile,
      name,
      dateOfBirth,
      gender,
      ipAddress,
      userAgent,
      deviceInfo,
      appSource,
      location
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

module.exports = {
  sendOTP,
  verifyOTP,
  completeProfile,
  refreshToken,
  logout,
  getCurrentUser,
};
