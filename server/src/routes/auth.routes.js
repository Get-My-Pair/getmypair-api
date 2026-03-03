const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');
const {
  sendOTPValidation,
  verifyOTPValidation,
  completeProfileValidation,
  refreshTokenValidation,
} = require('../validations/auth.validation');
const {
  otpRateLimiter,
} = require('../middleware/rateLimit');

router.post('/send-otp', otpRateLimiter, sendOTPValidation, authController.sendOTP);
router.post('/verify-otp', otpRateLimiter, verifyOTPValidation, authController.verifyOTP);
router.post('/complete-profile', completeProfileValidation, authController.completeProfile);
router.post('/refresh-token', refreshTokenValidation, authController.refreshToken);
router.post('/logout', authMiddleware, authController.logout);
router.get('/me', authMiddleware, authController.getCurrentUser);

module.exports = router;
