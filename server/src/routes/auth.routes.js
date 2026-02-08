const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { authLimiter, otpLimiter } = require('../middleware/rateLimit');
const {
  validateRegister,
  validateLogin,
  validateVerifyEmail,
  validatePasswordResetRequest,
  validatePasswordReset,
  validateRefreshToken,
} = require('../validations/auth.validation');

// Public routes
router.post(
  '/register',
  authLimiter,
  validateRegister,
  authController.register
);

router.post(
  '/login',
  authLimiter,
  validateLogin,
  authController.login
);

router.post(
  '/verify-email',
  otpLimiter,
  validateVerifyEmail,
  authController.verifyEmail
);

router.post(
  '/request-password-reset',
  otpLimiter,
  validatePasswordResetRequest,
  authController.requestPasswordReset
);

router.post(
  '/reset-password',
  authLimiter,
  validatePasswordReset,
  authController.resetPassword
);

router.post(
  '/refresh-token',
  validateRefreshToken,
  authController.refreshToken
);

// Protected routes
router.post(
  '/logout',
  authMiddleware.authenticate,
  validateRefreshToken,
  authController.logout
);

router.get(
  '/profile',
  authMiddleware.authenticate,
  authController.getProfile
);

module.exports = router;
