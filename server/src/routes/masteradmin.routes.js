/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : masteradmin.routes.js
 * Description: Masteradmin Dashboard APIs (/api/masteradmin)
 * ----------------------------------------------------------------------------
 */

const express = require('express');
const router = express.Router();
const adminMasterAuth = require('../middleware/adminMasterAuth.middleware');
const adminDashboardController = require('../controllers/adminDashboard.controller');
const darkstorePaymentController = require('../controllers/darkstorePayment.controller');
const dbMaintenanceController = require('../controllers/dbMaintenance.controller');
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
  dbMaintenanceConfirmValidation,
  dbMaintenanceCollectionValidation,
  dbMaintenanceGroupValidation,
} = require('../validations/adminDashboard.validation');
const { adminLoginRateLimiter } = require('../middleware/rateLimit');

// Auth — email OTP after password
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

// Operations
router.get('/dashboard/stats', adminMasterAuth, adminDashboardController.dashboardStats);
router.get('/users', adminMasterAuth, adminDashboardController.listUsers);
router.delete('/users/:id', adminMasterAuth, adminDashboardController.deleteUser);
router.get(
  '/articles/by-owner',
  adminMasterAuth,
  adminDashboardController.listArticleOwnersSummary
);
router.get('/articles', adminMasterAuth, adminDashboardController.listArticles);
router.get('/service-requests', adminMasterAuth, adminDashboardController.listServiceRequests);
router.get(
  '/service-requests/:id',
  adminMasterAuth,
  adminDashboardController.getServiceRequestById
);
router.patch(
  '/service-requests/:id',
  adminMasterAuth,
  adminDashboardController.patchServiceRequestWorkflow
);
router.delete(
  '/service-requests/:id',
  adminMasterAuth,
  adminDashboardController.deleteServiceRequest
);
router.get('/cobblers', adminMasterAuth, adminDashboardController.listCobblers);
router.patch('/cobblers/:id/verify', adminMasterAuth, adminDashboardController.verifyCobbler);
router.get('/delivery-partners', adminMasterAuth, adminDashboardController.listDeliveryPartners);

// Payments (same handlers as Darkworkstore — Masteradmin also manages payments)
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

// DB maintenance
router.get('/db/overview', adminMasterAuth, dbMaintenanceController.overview);
router.post(
  '/db/clear/collection',
  adminMasterAuth,
  dbMaintenanceCollectionValidation,
  dbMaintenanceController.clearCollection
);
router.post(
  '/db/clear/group',
  adminMasterAuth,
  dbMaintenanceGroupValidation,
  dbMaintenanceController.clearGroup
);
router.post(
  '/db/clear/all',
  adminMasterAuth,
  dbMaintenanceConfirmValidation,
  dbMaintenanceController.clearAll
);

module.exports = router;
