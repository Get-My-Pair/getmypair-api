/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : auth.routes.js
 * Description: Auth routes – send-otp, verify-otp, complete-profile, refresh-token, logout, me
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
