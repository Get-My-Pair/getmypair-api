const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');
const {
  registerValidation,
  loginValidation,
  sendOTPValidation,
  verifyOTPValidation,
  refreshTokenValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
} = require('../validations/auth.validation');
const {
  globalRateLimiter,
  loginRateLimiter,
  otpRateLimiter,
  registerRateLimiter,
} = require('../middleware/rateLimit');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  registerRateLimiter,
  registerValidation,
  authController.register
);

/**
 * @route   POST /api/auth/send-otp
 * @desc    Send OTP to user's email or phone
 * @access  Public
 */
router.post('/send-otp', otpRateLimiter, sendOTPValidation, authController.sendOTP);

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify OTP code
 * @access  Public
 */
router.post(
  '/verify-otp',
  otpRateLimiter,
  verifyOTPValidation,
  authController.verifyOTP
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and get JWT tokens
 * @access  Public
 */
router.post('/login', loginRateLimiter, loginValidation, authController.login);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
  '/refresh-token',
  refreshTokenValidation,
  authController.refreshToken
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and invalidate session
 * @access  Private
 */
router.post('/logout', authMiddleware, authController.logout);

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user
 * @access  Private
 */
router.get('/me', authMiddleware, authController.getCurrentUser);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset OTP
 * @access  Public
 */
router.post(
  '/forgot-password',
  otpRateLimiter,
  forgotPasswordValidation,
  authController.forgotPassword
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password using OTP
 * @access  Public
 */
router.post(
  '/reset-password',
  resetPasswordValidation,
  authController.resetPassword
);

module.exports = router;
