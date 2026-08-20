/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : darkworkstore.routes.js
 * Description: Darkworkstore Dashboard APIs (/api/darkworkstore)
 *              Auth + payment operations. Future store APIs: empty stubs below.
 * ----------------------------------------------------------------------------
 */

const express = require('express');
const router = express.Router();
const adminMasterAuth = require('../middleware/adminMasterAuth.middleware');
const adminDashboardController = require('../controllers/adminDashboard.controller');
const darkstorePaymentController = require('../controllers/darkstorePayment.controller');
const {
  adminLoginValidation,
  adminVerifyOtpValidation,
  adminResendOtpValidation,
  darkstoreUpdateCostValidation,
  darkstorePaymentQueryValidation,
  darkstoreOrderParamValidation,
  darkstorePaymentIdParamValidation,
  darkstoreServiceRequestParamValidation,
  darkstoreSettlementParamValidation,
  darkstoreReportQueryValidation,
  darkworkstoreRegisterValidation,
  darkworkstoreJobQueryValidation,
  darkworkstoreJobIdValidation,
  darkworkstoreAssignCobblerValidation,
  darkworkstoreCreateCobblerValidation,
  darkworkstoreCobblerIdValidation,
  assignDeliveryValidation,
} = require('../validations/adminDashboard.validation');
const { adminLoginRateLimiter } = require('../middleware/rateLimit');
const darkworkstoreUserController = require('../controllers/darkworkstoreUser.controller');
const darkworkstoreJobsController = require('../controllers/darkworkstoreJobs.controller');
const darkworkstoreCobblerController = require('../controllers/darkworkstoreCobbler.controller');
const deliveryMemberController = require('../controllers/deliveryMember.controller');

// Public store registration (no JWT). Login is allowed only after Masteradmin verifies.
router.post(
  '/auth/register',
  adminLoginRateLimiter,
  darkworkstoreRegisterValidation,
  darkworkstoreUserController.register
);

// Auth — first login: password + one-time email OTP; later: email + password only
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

router.get('/dashboard/stats', adminMasterAuth, darkworkstoreJobsController.overviewStats);

// Payments
router.get(
  '/payments/cost-approval',
  adminMasterAuth,
  darkstorePaymentQueryValidation,
  darkstorePaymentController.costApprovalJobs
);
router.patch(
  '/payments/cost/:serviceRequestId',
  adminMasterAuth,
  darkstoreUpdateCostValidation,
  darkstorePaymentController.updateActualCost
);
router.get(
  '/payments/status',
  adminMasterAuth,
  darkstorePaymentQueryValidation,
  darkstorePaymentController.paymentStatusList
);
router.get(
  '/payments/status/:orderId',
  adminMasterAuth,
  darkstoreOrderParamValidation,
  darkstorePaymentController.paymentStatusByOrder
);
router.get(
  '/payments/jobs/paid',
  adminMasterAuth,
  darkstorePaymentQueryValidation,
  darkstorePaymentController.paidJobs
);
router.get(
  '/payments/jobs/unpaid',
  adminMasterAuth,
  darkstorePaymentQueryValidation,
  darkstorePaymentController.unpaidJobs
);
router.get(
  '/payments/revenue',
  adminMasterAuth,
  darkstorePaymentQueryValidation,
  darkstorePaymentController.revenueDashboard
);
router.get(
  '/payments/transactions',
  adminMasterAuth,
  darkstorePaymentQueryValidation,
  darkstorePaymentController.transactions
);
router.get(
  '/payments/transactions/:paymentId',
  adminMasterAuth,
  darkstorePaymentIdParamValidation,
  darkstorePaymentController.transactionDetails
);
router.get(
  '/payments/history/:serviceRequestId',
  adminMasterAuth,
  darkstoreServiceRequestParamValidation,
  darkstorePaymentController.servicePaymentHistory
);
router.get(
  '/payments/settlements',
  adminMasterAuth,
  darkstorePaymentQueryValidation,
  darkstorePaymentController.settlements
);
router.post(
  '/payments/settlements/:settlementId/process',
  adminMasterAuth,
  darkstoreSettlementParamValidation,
  darkstorePaymentController.processSettlement
);
router.get(
  '/payments/reports/monthly',
  adminMasterAuth,
  darkstoreReportQueryValidation,
  darkstorePaymentController.monthlyReport
);
router.get(
  '/payments/notifications',
  adminMasterAuth,
  darkstorePaymentQueryValidation,
  darkstorePaymentController.paymentNotifications
);

// Jobs — user-app service requests for this store
router.get('/jobs', adminMasterAuth, darkworkstoreJobQueryValidation, darkworkstoreJobsController.listJobs);
router.get('/jobs/pickup', adminMasterAuth, darkworkstoreJobsController.listPickupJobs);
router.get('/jobs/return', adminMasterAuth, darkworkstoreJobsController.listReturnJobs);
router.get('/jobs/workflow', adminMasterAuth, darkworkstoreJobsController.listWorkflowJobs);
router.post(
  '/jobs/:id/accept',
  adminMasterAuth,
  darkworkstoreJobIdValidation,
  darkworkstoreJobsController.acceptJob
);
router.post(
  '/jobs/:id/reject',
  adminMasterAuth,
  darkworkstoreJobIdValidation,
  darkworkstoreJobsController.rejectJob
);
router.post(
  '/jobs/:id/assign-cobbler',
  adminMasterAuth,
  darkworkstoreAssignCobblerValidation,
  darkworkstoreJobsController.assignCobbler
);
router.post(
  '/jobs/:id/assign-delivery',
  adminMasterAuth,
  assignDeliveryValidation,
  darkworkstoreJobsController.assignDelivery
);
router.post(
  '/jobs/:id/receive',
  adminMasterAuth,
  darkworkstoreJobIdValidation,
  darkworkstoreJobsController.receiveAtStore
);
router.post(
  '/jobs/:id/progress',
  adminMasterAuth,
  darkworkstoreJobIdValidation,
  darkworkstoreJobsController.updateProgress
);

router.get('/delivery-members', adminMasterAuth, deliveryMemberController.list);

// Internal cobblers / employees
router.get('/cobblers', adminMasterAuth, darkworkstoreCobblerController.listCobblers);
router.post(
  '/cobblers',
  adminMasterAuth,
  darkworkstoreCreateCobblerValidation,
  darkworkstoreCobblerController.createCobbler
);
router.delete(
  '/cobblers/:id',
  adminMasterAuth,
  darkworkstoreCobblerIdValidation,
  darkworkstoreCobblerController.deleteCobbler
);

module.exports = router;
