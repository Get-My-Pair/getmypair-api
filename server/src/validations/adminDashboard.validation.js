/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : adminDashboard.validation.js
 * ----------------------------------------------------------------------------
 */

const { body, param, query } = require('express-validator');
const { handleValidationErrors } = require('../utils/validators');

const adminLoginValidation = [
  body('email').trim().notEmpty().withMessage('email is required').isEmail().withMessage('Invalid email'),
  body('password').notEmpty().withMessage('password is required'),
  handleValidationErrors,
];

const darkstoreUpdateCostValidation = [
  param('serviceRequestId').notEmpty().isMongoId().withMessage('Valid serviceRequestId required'),
  body('actualCost')
    .notEmpty()
    .withMessage('actualCost is required')
    .isFloat({ min: 0 })
    .withMessage('actualCost must be a non-negative number'),
  handleValidationErrors,
];

const darkstorePaymentQueryValidation = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('darkStoreId').optional().isString(),
  handleValidationErrors,
];

const darkstoreOrderParamValidation = [
  param('orderId').notEmpty().isString(),
  handleValidationErrors,
];

const darkstorePaymentIdParamValidation = [
  param('paymentId').notEmpty().isString(),
  handleValidationErrors,
];

const darkstoreServiceRequestParamValidation = [
  param('serviceRequestId').notEmpty().isMongoId(),
  handleValidationErrors,
];

const darkstoreSettlementParamValidation = [
  param('settlementId').notEmpty().isMongoId(),
  handleValidationErrors,
];

const darkstoreReportQueryValidation = [
  query('year').optional().isInt({ min: 2020, max: 2100 }),
  query('month').optional().isInt({ min: 1, max: 12 }),
  query('darkStoreId').optional().isString(),
  handleValidationErrors,
];

module.exports = {
  adminLoginValidation,
  darkstoreUpdateCostValidation,
  darkstorePaymentQueryValidation,
  darkstoreOrderParamValidation,
  darkstorePaymentIdParamValidation,
  darkstoreServiceRequestParamValidation,
  darkstoreSettlementParamValidation,
  darkstoreReportQueryValidation,
};
