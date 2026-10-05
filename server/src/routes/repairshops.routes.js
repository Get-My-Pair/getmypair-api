/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : repairshops.routes.js
 * Description: Repairshops Dashboard APIs (/api/repairshops)
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
  adminForgotPasswordValidation,
  adminResetPasswordValidation,
  darkstoreUpdateCostValidation,
  darkstorePaymentQueryValidation,
  darkstoreOrderParamValidation,
  darkstorePaymentIdParamValidation,
  darkstoreServiceRequestParamValidation,
  darkstoreSettlementParamValidation,
  darkstoreReportQueryValidation,
  repairshopsRegisterValidation,
  repairshopsJobQueryValidation,
  repairshopsJobIdValidation,
  repairshopsAssignCobblerValidation,
  repairshopsCreateCobblerValidation,
  repairshopsCobblerIdValidation,
  assignDeliveryValidation,
} = require('../validations/adminDashboard.validation');
const { adminLoginRateLimiter } = require('../middleware/rateLimit');
const repairshopsUserController = require('../controllers/repairshopsUser.controller');
const repairshopsJobsController = require('../controllers/repairshopsJobs.controller');
const repairshopsCobblerController = require('../controllers/repairshopsCobbler.controller');
const deliveryMemberController = require('../controllers/deliveryMember.controller');

// Public store registration (no JWT). Login is allowed only after Masteradmin verifies.
router.post(
  '/auth/register',
  adminLoginRateLimiter,
  repairshopsRegisterValidation,
  repairshopsUserController.register
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
router.post(
  '/auth/forgot-password',
  adminLoginRateLimiter,
  adminForgotPasswordValidation,
  adminDashboardController.forgotPassword
);
router.post(
  '/auth/forgot-password/resend-otp',
  adminLoginRateLimiter,
  adminResendOtpValidation,
  adminDashboardController.resendForgotPasswordOtp
);
router.post(
  '/auth/forgot-password/verify-otp',
  adminLoginRateLimiter,
  adminVerifyOtpValidation,
  adminDashboardController.verifyForgotPasswordOtp
);
router.post(
  '/auth/reset-password',
  adminLoginRateLimiter,
  adminResetPasswordValidation,
  adminDashboardController.resetPassword
);
router.get('/auth/me', adminMasterAuth, adminDashboardController.me);

router.get('/dashboard/stats', adminMasterAuth, repairshopsJobsController.overviewStats);

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
router.get('/jobs', adminMasterAuth, repairshopsJobQueryValidation, repairshopsJobsController.listJobs);
router.get('/jobs/pickup', adminMasterAuth, repairshopsJobsController.listPickupJobs);
router.get('/jobs/return', adminMasterAuth, repairshopsJobsController.listReturnJobs);
router.get('/jobs/workflow', adminMasterAuth, repairshopsJobsController.listWorkflowJobs);
router.post(
  '/jobs/:id/accept',
  adminMasterAuth,
  repairshopsJobIdValidation,
  repairshopsJobsController.acceptJob
);
router.post(
  '/jobs/:id/reject',
  adminMasterAuth,
  repairshopsJobIdValidation,
  repairshopsJobsController.rejectJob
);
router.post(
  '/jobs/:id/assign-cobbler',
  adminMasterAuth,
  repairshopsAssignCobblerValidation,
  repairshopsJobsController.assignCobbler
);
router.post(
  '/jobs/:id/assign-delivery',
  adminMasterAuth,
  assignDeliveryValidation,
  repairshopsJobsController.assignDelivery
);
router.post(
  '/jobs/:id/receive',
  adminMasterAuth,
  repairshopsJobIdValidation,
  repairshopsJobsController.receiveAtStore
);
router.post(
  '/jobs/:id/progress',
  adminMasterAuth,
  repairshopsJobIdValidation,
  repairshopsJobsController.updateProgress
);

router.get('/delivery-members', adminMasterAuth, deliveryMemberController.list);

// Internal cobblers / employees
router.get('/cobblers', adminMasterAuth, repairshopsCobblerController.listCobblers);
router.post(
  '/cobblers',
  adminMasterAuth,
  repairshopsCreateCobblerValidation,
  repairshopsCobblerController.createCobbler
);
router.delete(
  '/cobblers/:id',
  adminMasterAuth,
  repairshopsCobblerIdValidation,
  repairshopsCobblerController.deleteCobbler
);

module.exports = router;
