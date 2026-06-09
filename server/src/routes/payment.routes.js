/**
 * Module 5 — Payment routes (Zoho, cost approval, settlements, reporting)
 */
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const paymentController = require('../controllers/payment.controller');
const {
  createPaymentOrderValidation,
  createPaymentLinkValidation,
  verifyPaymentValidation,
  costApprovalValidation,
  costRejectValidation,
  paymentIdParam,
  refundValidation,
  settlementValidation,
  reportQueryValidation,
  historyQueryValidation,
  serviceRequestIdParam,
  orderIdParam,
  paymentStatusQueryValidation,
  darkStoreRevenueValidation,
} = require('../validations/payment.validation');

/** Mock checkout page (dev) — webhook mounted in app.js before JSON parser */
router.get('/mock-checkout', paymentController.mockCheckout);

router.use(authMiddleware);

router.post(
  '/order',
  roleMiddleware(['USER']),
  createPaymentOrderValidation,
  paymentController.createPaymentOrder
);
router.post(
  '/link',
  roleMiddleware(['USER']),
  createPaymentLinkValidation,
  paymentController.createPaymentLink
);
router.post(
  '/verify',
  roleMiddleware(['USER']),
  verifyPaymentValidation,
  paymentController.verifyPayment
);

router.post(
  '/cost/approve',
  roleMiddleware(['USER']),
  costApprovalValidation,
  paymentController.approveCost
);
router.post(
  '/cost/reject',
  roleMiddleware(['USER']),
  costRejectValidation,
  paymentController.rejectCost
);

router.get(
  '/history',
  roleMiddleware(['USER']),
  historyQueryValidation,
  paymentController.paymentHistory
);
router.get(
  '/status/:orderId',
  roleMiddleware(['USER']),
  orderIdParam,
  paymentStatusQueryValidation,
  paymentController.paymentStatus
);
router.get(
  '/by-service-request/:serviceRequestId',
  roleMiddleware(['USER']),
  serviceRequestIdParam,
  paymentController.paymentByServiceRequest
);
router.get(
  '/cobbler/earnings',
  roleMiddleware(['COBBER']),
  paymentController.cobblerEarnings
);
router.get(
  '/admin/report',
  roleMiddleware(['ADMIN']),
  reportQueryValidation,
  paymentController.paymentReport
);
router.get(
  '/admin/commission-preview',
  roleMiddleware(['ADMIN', 'USER', 'COBBER']),
  paymentController.commissionPreview
);
router.get(
  '/darkstore/:darkStoreId/revenue',
  roleMiddleware(['ADMIN', 'COBBER']),
  darkStoreRevenueValidation,
  paymentController.darkStoreRevenue
);

router.post(
  '/settlement/process',
  roleMiddleware(['ADMIN']),
  settlementValidation,
  paymentController.processSettlement
);
router.post(
  '/refund',
  roleMiddleware(['USER', 'ADMIN']),
  refundValidation,
  paymentController.createRefund
);

router.get(
  '/:paymentId',
  roleMiddleware(['USER', 'ADMIN']),
  paymentIdParam,
  paymentController.paymentDetails
);

module.exports = router;
