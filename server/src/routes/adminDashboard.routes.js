/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : adminDashboard.routes.js
 * Description: Master admin dashboard API routes (/api/sys-admin)
 * ----------------------------------------------------------------------------
 */

const express = require('express');
const router = express.Router();
const adminMasterAuth = require('../middleware/adminMasterAuth.middleware');
const adminDashboardController = require('../controllers/adminDashboard.controller');
const darkstorePaymentController = require('../controllers/darkstorePayment.controller');
const {
  adminLoginValidation,
  darkstoreUpdateCostValidation,
  darkstorePaymentQueryValidation,
  darkstoreOrderParamValidation,
  darkstorePaymentIdParamValidation,
  darkstoreServiceRequestParamValidation,
  darkstoreSettlementParamValidation,
  darkstoreReportQueryValidation,
} = require('../validations/adminDashboard.validation');
const { adminLoginRateLimiter } = require('../middleware/rateLimit');

// Public
router.post(
  '/auth/login',
  adminLoginRateLimiter,
  adminLoginValidation,
  adminDashboardController.login
);

// Protected
router.get('/auth/me', adminMasterAuth, adminDashboardController.me);
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

// Darkworkstore payment module (Module 5 admin UI)
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

module.exports = router;
