const authService = require('../services/auth.service');
const tokenService = require('../services/token.service');
const { success, error: errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

/**
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
 * POST /api/auth/send-otp
 */
const sendOTP = async (req, res) => {
  try {
    const { email, phone, type } = req.body;

    await authService.sendOTP(email, phone, type);

    return success(res, 'OTP sent successfully', {
      expiresIn: 600, // 10 minutes in seconds
    });
  } catch (err) {
    logger.error(`Send OTP error: ${err.message}`);
    return errorResponse(res, err.message, 400);
  }
};

/**
 * Verify OTP
 * POST /api/auth/verify-otp
 */
const verifyOTP = async (req, res) => {
  try {
    const { email, phone, otp, type } = req.body;

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
        user: result.user,
        tokens: result.tokens,
      });
    }

    // Regular OTP verification
    const otpService = require('../services/otp.service');
    const verification = await otpService.verifyOTP(email, phone, otp, type);

    if (!verification.valid) {
      return errorResponse(res, verification.message, 400);
    }

    return success(res, 'OTP verified successfully', {
      verified: true,
    });
  } catch (err) {
    logger.error(`Verify OTP error: ${err.message}`);
    return errorResponse(res, err.message, 400);
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent') || 'unknown';
    const deviceInfo = req.get('device-info') || 'unknown';

    const result = await authService.loginUser(
      email,
      password,
      ipAddress,
      userAgent,
      deviceInfo
    );

    return success(res, 'Login successful', {
      user: result.user,
      tokens: result.tokens,
    });
  } catch (err) {
    logger.error(`Login error: ${err.message}`);
    
    if (err.message.includes('locked')) {
      return errorResponse(res, err.message, 403);
    }
    if (err.message.includes('verified')) {
      return errorResponse(res, err.message, 403);
    }
    
    return errorResponse(res, err.message, 401);
  }
};

/**
 * Refresh access token
 * POST /api/auth/refresh-token
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    const result = await tokenService.refreshAccessToken(refreshToken);

    return success(res, 'Token refreshed successfully', {
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
    });
  } catch (err) {
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

    if (refreshToken) {
      await tokenService.revokeSession(refreshToken);
    } else if (req.session) {
      await req.session.revoke();
    }

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
    const user = await authService.getCurrentUser(req.user._id);

    return success(res, 'User retrieved successfully', {
      user,
    });
  } catch (err) {
    logger.error(`Get current user error: ${err.message}`);
    return errorResponse(res, err.message, 404);
  }
};

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

module.exports = {
  register,
  sendOTP,
  verifyOTP,
  login,
  refreshToken,
  logout,
  getCurrentUser,
  forgotPassword,
  resetPassword,
  verifyMobileOTP,
  completeMobileRegistration,
  updateProfile,
};
