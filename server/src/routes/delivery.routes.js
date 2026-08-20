/**
 * Delivery member dashboard APIs (/api/delivery)
 * Auth shares Masteradmin login handlers. Jobs are assigned pickups/returns.
 */
const express = require('express');
const router = express.Router();
const adminMasterAuth = require('../middleware/adminMasterAuth.middleware');
const adminDashboardController = require('../controllers/adminDashboard.controller');
const deliveryJobsController = require('../controllers/deliveryJobs.controller');
const {
  adminLoginValidation,
  adminVerifyOtpValidation,
  adminResendOtpValidation,
  darkworkstoreJobIdValidation,
} = require('../validations/adminDashboard.validation');
const { adminLoginRateLimiter } = require('../middleware/rateLimit');

router.post(
  '/auth/login',
  adminLoginRateLimiter,
  adminLoginValidation,
  adminDashboardController.login
);
router.post(
  '/auth/verify-otp',
  adminLoginRateLimiter,
  adminVerifyOtpValidation,
  adminDashboardController.verifyLoginOtp
);
router.post(
  '/auth/resend-otp',
  adminLoginRateLimiter,
  adminResendOtpValidation,
  adminDashboardController.resendLoginOtp
);
router.get('/auth/me', adminMasterAuth, adminDashboardController.me);

router.get('/jobs', adminMasterAuth, deliveryJobsController.listJobs);
router.get('/jobs/:id', adminMasterAuth, darkworkstoreJobIdValidation, deliveryJobsController.getJob);
router.post(
  '/jobs/:id/status',
  adminMasterAuth,
  darkworkstoreJobIdValidation,
  deliveryJobsController.updateStatus
);

module.exports = router;
