const { body, param, query } = require('express-validator');
const { handleValidationErrors } = require('../utils/validators');

const serviceRequestIdBody = body('serviceRequestId')
  .notEmpty()
  .withMessage('serviceRequestId is required')
  .isMongoId()
  .withMessage('serviceRequestId must be a valid id');

const createPaymentOrderValidation = [serviceRequestIdBody, handleValidationErrors];

const createPaymentLinkValidation = [
  serviceRequestIdBody,
  body('redirectUrl').optional().isURL().withMessage('redirectUrl must be a valid URL'),
  handleValidationErrors,
];

const verifyPaymentValidation = [
  body('orderId').notEmpty().withMessage('orderId is required').isString(),
  handleValidationErrors,
];

const costApprovalValidation = [
  serviceRequestIdBody,
  body('reason').optional().isString().isLength({ max: 500 }),
  handleValidationErrors,
];

const paymentIdParam = [
  param('paymentId')
    .notEmpty()
    .custom((v) => {
      if (/^GMP-/.test(v)) return true;
      return require('mongoose').Types.ObjectId.isValid(v);
    })
    .withMessage('paymentId must be a valid id or order id'),
  handleValidationErrors,
];

const refundValidation = [
  body('paymentId').notEmpty().isMongoId(),
  body('reason').optional().isString().isLength({ max: 500 }),
  body('amount').optional().isFloat({ min: 0 }),
  handleValidationErrors,
];

const settlementValidation = [
  body('settlementId').notEmpty().isMongoId().withMessage('settlementId is required'),
  handleValidationErrors,
];

const reportQueryValidation = [
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
  query('groupBy').optional().isIn(['day', 'week', 'month']),
  handleValidationErrors,
];

const historyQueryValidation = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  handleValidationErrors,
];

const orderIdParam = [
  param('orderId').notEmpty().isString().withMessage('orderId is required'),
  handleValidationErrors,
];

const paymentStatusQueryValidation = [
  query('refresh').optional().isIn(['true', 'false', '1', '0']),
  handleValidationErrors,
];

module.exports = {
  createPaymentOrderValidation,
  createPaymentLinkValidation,
  verifyPaymentValidation,
  costApprovalValidation,
  costRejectValidation: costApprovalValidation,
  paymentIdParam,
  refundValidation,
  settlementValidation,
  reportQueryValidation,
  historyQueryValidation,
  orderIdParam,
  paymentStatusQueryValidation,
  darkStoreRevenueValidation: [
    param('darkStoreId').notEmpty().isString(),
    query('from').optional().isISO8601(),
    query('to').optional().isISO8601(),
    handleValidationErrors,
  ],
};
