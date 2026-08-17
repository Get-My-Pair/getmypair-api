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

const adminVerifyOtpValidation = [
  body('challengeToken').trim().notEmpty().withMessage('challengeToken is required'),
  body('otp')
    .trim()
    .notEmpty()
    .withMessage('otp is required')
    .isLength({ min: 4, max: 8 })
    .withMessage('Invalid otp'),
  handleValidationErrors,
];

const adminResendOtpValidation = [
  body('challengeToken').trim().notEmpty().withMessage('challengeToken is required'),
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

const dbMaintenanceConfirmValidation = [
  body('confirmPhrase').trim().notEmpty().withMessage('confirmPhrase is required'),
  handleValidationErrors,
];

const dbMaintenanceCollectionValidation = [
  body('collection').trim().notEmpty().withMessage('collection is required'),
  body('confirmPhrase').trim().notEmpty().withMessage('confirmPhrase is required'),
  handleValidationErrors,
];

const dbMaintenanceGroupValidation = [
  body('group').trim().notEmpty().withMessage('group is required'),
  body('confirmPhrase').trim().notEmpty().withMessage('confirmPhrase is required'),
  handleValidationErrors,
];

const darkworkstoreRegisterValidation = [
  body('name').trim().notEmpty().withMessage('name is required'),
  body('email').trim().notEmpty().withMessage('email is required').isEmail().withMessage('Invalid email'),
  body('phone').trim().notEmpty().withMessage('phone is required'),
  body('storeName').trim().notEmpty().withMessage('storeName is required'),
  body('address').optional({ nullable: true }).trim(),
  body('city').optional({ nullable: true }).trim(),
  body('state').optional({ nullable: true }).trim(),
  body('pincode').optional({ nullable: true }).trim(),
  body('notes').optional({ nullable: true }).trim(),
  handleValidationErrors,
];

const darkworkstoreUserIdValidation = [
  param('id').notEmpty().isMongoId().withMessage('Valid Darkworkstore user id required'),
  handleValidationErrors,
];

const darkworkstoreUserUpdateValidation = [
  param('id').notEmpty().isMongoId().withMessage('Valid Darkworkstore user id required'),
  body('name').optional().trim().notEmpty().withMessage('name cannot be empty'),
  body('email').optional().trim().isEmail().withMessage('Invalid email'),
  body('phone').optional().trim(),
  body('storeName').optional().trim().notEmpty().withMessage('storeName cannot be empty'),
  body('address').optional({ nullable: true }).trim(),
  body('city').optional({ nullable: true }).trim(),
  body('state').optional({ nullable: true }).trim(),
  body('pincode').optional({ nullable: true }).trim(),
  body('notes').optional({ nullable: true }).trim(),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
  handleValidationErrors,
];

const darkworkstoreJobQueryValidation = [
  query('status').optional().isIn(['inbox', 'accepted', 'all']).withMessage('status must be inbox, accepted, or all'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  handleValidationErrors,
];

const darkworkstoreJobIdValidation = [
  param('id').notEmpty().isMongoId().withMessage('Valid job id required'),
  handleValidationErrors,
];

const darkworkstoreAssignCobblerValidation = [
  param('id').notEmpty().isMongoId().withMessage('Valid job id required'),
  body('cobblerId').trim().notEmpty().withMessage('cobblerId is required').isMongoId().withMessage('Valid cobblerId required'),
  handleValidationErrors,
];

const darkworkstoreCreateCobblerValidation = [
  body('name').trim().notEmpty().withMessage('name is required'),
  body('phone').trim().notEmpty().withMessage('phone is required'),
  body('shopName').optional({ nullable: true }).trim(),
  body('shopAddress').optional({ nullable: true }).trim(),
  body('gender').optional().isIn(['male', 'female', 'other']),
  body('dateOfBirth').optional().isISO8601().withMessage('Invalid dateOfBirth'),
  handleValidationErrors,
];

const darkworkstoreCobblerIdValidation = [
  param('id').notEmpty().isMongoId().withMessage('Valid cobbler id required'),
  handleValidationErrors,
];

module.exports = {
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
  darkworkstoreRegisterValidation,
  darkworkstoreUserIdValidation,
  darkworkstoreUserUpdateValidation,
  darkworkstoreJobQueryValidation,
  darkworkstoreJobIdValidation,
  darkworkstoreAssignCobblerValidation,
  darkworkstoreCreateCobblerValidation,
  darkworkstoreCobblerIdValidation,
};
