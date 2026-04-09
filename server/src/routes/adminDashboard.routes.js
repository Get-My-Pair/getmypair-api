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
const { adminLoginValidation } = require('../validations/adminDashboard.validation');
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

module.exports = router;
