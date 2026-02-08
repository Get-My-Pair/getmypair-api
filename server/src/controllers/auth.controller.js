const authService = require('../services/auth.service');
const tokenService = require('../services/token.service');
const { sendSuccess, sendError } = require('../utils/response');
const logger = require('../utils/logger');

const getDeviceInfo = (req) => {
  return {
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent') || '',
    deviceType: req.get('user-agent')?.includes('Mobile') ? 'mobile' : 'desktop',
  };
};

const register = async (req, res, next) => {
  try {
    const deviceInfo = getDeviceInfo(req);
    const user = await authService.register(req.body, deviceInfo);

    return sendSuccess(
      res,
      { user },
      'Registration successful. Please verify your email.',
      201
    );
  } catch (error) {
    logger.error('Register controller error:', error);
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const deviceInfo = getDeviceInfo(req);

    const result = await authService.login(email, password, deviceInfo);

    return sendSuccess(res, result, 'Login successful');
  } catch (error) {
    logger.error('Login controller error:', error);
    next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const user = await authService.verifyEmail(email, otp);

    return sendSuccess(res, { user }, 'Email verified successfully');
  } catch (error) {
    logger.error('Verify email controller error:', error);
    next(error);
  }
};

const requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await authService.requestPasswordReset(email);

    return sendSuccess(res, null, result.message);
  } catch (error) {
    logger.error('Request password reset controller error:', error);
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await authService.resetPassword(email, otp, newPassword);

    return sendSuccess(res, { user }, 'Password reset successful');
  } catch (error) {
    logger.error('Reset password controller error:', error);
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await tokenService.refreshAccessToken(refreshToken);

    return sendSuccess(res, result, 'Token refreshed successfully');
  } catch (error) {
    logger.error('Refresh token controller error:', error);
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const userId = req.user?._id;

    const result = await authService.logout(refreshToken, userId);

    return sendSuccess(res, null, result.message);
  } catch (error) {
    logger.error('Logout controller error:', error);
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const user = req.user;
    return sendSuccess(res, { user }, 'Profile retrieved successfully');
  } catch (error) {
    logger.error('Get profile controller error:', error);
    next(error);
  }
};

module.exports = {
  register,
  login,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  refreshToken,
  logout,
  getProfile,
};
