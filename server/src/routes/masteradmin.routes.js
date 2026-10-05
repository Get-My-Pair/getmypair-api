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
  repairshopsUserIdValidation,
  repairshopsUserUpdateValidation,
  dbMaintenanceConfirmValidation,
  dbMaintenanceCollectionValidation,
  dbMaintenanceGroupValidation,
  deliveryMemberCreateValidation,
  deliveryMemberIdValidation,
  deliveryMemberUpdateValidation,
  assignDeliveryValidation,
} = require('../validations/adminDashboard.validation');
const { adminLoginRateLimiter } = require('../middleware/rateLimit');
const repairshopsUserController = require('../controllers/repairshopsUser.controller');
const deliveryMemberController = require('../controllers/deliveryMember.controller');
const repairshopsJobsController = require('../controllers/repairshopsJobs.controller');

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
router.get('/email-templates', adminMasterAuth, adminDashboardController.listEmailTemplates);

router.get('/delivery-members', adminMasterAuth, deliveryMemberController.list);
router.post(
  '/delivery-members',
  adminMasterAuth,
  deliveryMemberCreateValidation,
  deliveryMemberController.create
);
router.get(
  '/delivery-members/:id',
  adminMasterAuth,
  deliveryMemberIdValidation,
  deliveryMemberController.getById
);
router.patch(
  '/delivery-members/:id',
  adminMasterAuth,
  deliveryMemberUpdateValidation,
  deliveryMemberController.update
);
router.delete(
  '/delivery-members/:id',
  adminMasterAuth,
  deliveryMemberIdValidation,
  deliveryMemberController.remove
);
router.patch(
  '/delivery-members/:id/send-email',
  adminMasterAuth,
  deliveryMemberIdValidation,
  deliveryMemberController.sendEmail
);
router.get('/delivery-jobs/pickup', adminMasterAuth, repairshopsJobsController.listPickupJobs);
router.get('/delivery-jobs/return', adminMasterAuth, repairshopsJobsController.listReturnJobs);
router.post(
  '/delivery-jobs/:id/assign',
  adminMasterAuth,
  assignDeliveryValidation,
  repairshopsJobsController.assignDelivery
);

// Repairshops portal users (create / view / update / delete / verify)
router.get('/repairshops-users', adminMasterAuth, repairshopsUserController.list);
router.post(
  '/repairshops-users',
  adminMasterAuth,
  repairshopsRegisterValidation,
  repairshopsUserController.create
);
router.get(
  '/repairshops-users/:id',
  adminMasterAuth,
  repairshopsUserIdValidation,
  repairshopsUserController.getById
);
router.patch(
  '/repairshops-users/:id',
  adminMasterAuth,
  repairshopsUserUpdateValidation,
  repairshopsUserController.update
);
router.delete(
  '/repairshops-users/:id',
  adminMasterAuth,
  repairshopsUserIdValidation,
  repairshopsUserController.remove
);
router.patch(
  '/repairshops-users/:id/verify',
  adminMasterAuth,
  repairshopsUserIdValidation,
  repairshopsUserController.verify
);

// Legacy aliases (prefer /repairshops-users)
router.get('/darkworkstore-users', adminMasterAuth, repairshopsUserController.list);
router.post(
  '/darkworkstore-users',
  adminMasterAuth,
  repairshopsRegisterValidation,
  repairshopsUserController.create
);
router.get(
  '/darkworkstore-users/:id',
  adminMasterAuth,
  repairshopsUserIdValidation,
  repairshopsUserController.getById
);
router.patch(
  '/darkworkstore-users/:id',
  adminMasterAuth,
  repairshopsUserUpdateValidation,
  repairshopsUserController.update
);
router.delete(
  '/darkworkstore-users/:id',
  adminMasterAuth,
  repairshopsUserIdValidation,
  repairshopsUserController.remove
);
router.patch(
  '/darkworkstore-users/:id/verify',
  adminMasterAuth,
  repairshopsUserIdValidation,
  repairshopsUserController.verify
);

// Payments (same handlers as Repairshops — Masteradmin also manages payments)
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
