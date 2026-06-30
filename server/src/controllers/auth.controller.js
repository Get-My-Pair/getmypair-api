const authService = require('../services/auth.service');
const { success, error: errorResponse } = require('../utils/response');
const { t } = require('../utils/i18n');
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

    return success(res, t('otp_sent', req.locale), {
      expiresIn: result.expiresIn,
    });
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
      return success(res, t('login_success', req.locale), {
        user: result.user,
        tokens: result.tokens,
      });
    } else {
      // New user - Profile completion required
      return success(res, t('complete_profile', req.locale), {
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

    return success(res, t('profile_completed', req.locale), {
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

    return success(res, t('token_refreshed', req.locale), {
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

    return success(res, t('logout_success', req.locale));
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

    return success(res, t('user_retrieved', req.locale), {
      user,
    });
  } catch (err) {
    logger.error(`Get current user error: ${err.message}`);
    return errorResponse(res, err.message, 404);
  }
};

/**
 * Update user preferred language
 * PUT /api/auth/language
 */
const updateLanguage = async (req, res) => {
  try {
    const { preferredLanguage } = req.body;
    const user = await authService.updatePreferredLanguage(
      req.user._id,
      preferredLanguage,
      req.ip || req.connection.remoteAddress,
      req.get('user-agent') || 'unknown'
    );

    return success(res, t('language_updated', req.locale), { user });
  } catch (err) {
    logger.error(`Update language error: ${err.message}`);
    return errorResponse(res, err.message, 400);
  }
};

module.exports = {
  sendOTP,
  verifyOTP,
  completeProfile,
  refreshToken,
  logout,
  getCurrentUser,
  updateLanguage,
};
