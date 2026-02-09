const authService = require('../services/auth.service');
const tokenService = require('../services/token.service');
const { success, error: errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Register new user
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    // Register user
    const user = await authService.registerUser({
      email,
      password,
      firstName,
      lastName,
      phone,
    });

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

    // Check if this is for registration completion
    const User = require('../models/user.model');
    const user = await User.findOne({ email });

    if (user && !user.isEmailVerified && type === 'email') {
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
};
