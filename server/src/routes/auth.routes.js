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
const sessionController = require('../controllers/session.controller');
const authMiddleware = require('../middleware/auth.middleware');
const {
  sendOTPValidation,
  verifyOTPValidation,
  completeProfileValidation,
  refreshTokenValidation,
  logoutValidation,
  updateLanguageValidation,
} = require('../validations/auth.validation');
const {
  otpSendRateLimiter,
  otpVerifyRateLimiter,
} = require('../middleware/rateLimit');
const { requireAppSource } = require('../middleware/appSource.middleware');

router.post('/send-otp', sendOTPValidation, otpSendRateLimiter, authController.sendOTP);
router.post('/verify-otp', verifyOTPValidation, otpVerifyRateLimiter, authController.verifyOTP);
router.post('/complete-profile', requireAppSource, completeProfileValidation, authController.completeProfile);
router.post('/refresh-token', refreshTokenValidation, authController.refreshToken);
router.post('/logout', authMiddleware, logoutValidation, authController.logout);

// Manage devices (active sessions)
router.get('/sessions', authMiddleware, sessionController.listUserSessions);
router.delete('/sessions/:sessionId', authMiddleware, sessionController.revokeSession);

router.get('/me', authMiddleware, authController.getCurrentUser);
router.get('/languages', authController.getSupportedLanguages);
router.put('/language', authMiddleware, updateLanguageValidation, authController.updatePreferredLanguage);

module.exports = router;
