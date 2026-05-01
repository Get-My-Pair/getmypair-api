/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : service.validation.js
 * Description: Service Request validation – create
 * ----------------------------------------------------------------------------
 */

const { body, param } = require('express-validator');
const { handleValidationErrors } = require('../utils/validators');
const { serviceTypes, serviceStatuses, serviceTrackingStates } = require('../models/serviceRequest.model');

const createServiceRequestValidation = [
  body('articleId')
    .notEmpty()
    .withMessage('articleId is required')
    .isMongoId()
    .withMessage('articleId must be a valid Mongo ID'),
  body('serviceType')
    .trim()
    .notEmpty()
    .withMessage('serviceType is required')
    .isIn(serviceTypes)
    .withMessage(`serviceType must be one of: ${serviceTypes.join(', ')}`),
  body('addressId')
    .notEmpty()
    .withMessage('addressId is required')
    .isMongoId()
    .withMessage('addressId must be a valid Mongo ID'),
  body('photos')
    .optional()
    .isArray()
    .withMessage('photos must be an array'),
  body('photos.*')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Each photo must be a non-empty string'),
  body('videos')
    .optional()
    .isArray()
    .withMessage('videos must be an array'),
  body('videos.*')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Each video must be a non-empty string'),
  body('estimatedCost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('estimatedCost must be a non-negative number'),
  body('actualCost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('actualCost must be a non-negative number'),
  body('problemDescription')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('problemDescription must be at most 2000 characters'),
  body('pickupMode')
    .optional()
    .trim()
    .isIn(['home_pickup', 'cobbler_nearby'])
    .withMessage('pickupMode must be one of: home_pickup, cobbler_nearby'),
  body('requestedPickupAt')
    .optional({ values: 'falsy' })
    .isISO8601()
    .withMessage('requestedPickupAt must be a valid ISO 8601 date'),
  body('maintenancePlanId')
    .optional()
    .trim()
    .isLength({ max: 32 })
    .withMessage('maintenancePlanId must be at most 32 characters'),
  body('maintenancePlanLabel')
    .optional()
    .trim()
    .isLength({ max: 120 })
    .withMessage('maintenancePlanLabel must be at most 120 characters'),
  handleValidationErrors,
];

module.exports = {
  createServiceRequestValidation,
  cobblerListRequestsValidation: [
    handleValidationErrors,
  ],
  cobblerAcceptRequestValidation: [
    body('requestId')
      .notEmpty()
      .withMessage('requestId is required')
      .isMongoId()
      .withMessage('requestId must be a valid Mongo ID'),
    handleValidationErrors,
  ],
  cobblerRejectRequestValidation: [
    body('requestId')
      .notEmpty()
      .withMessage('requestId is required')
      .isMongoId()
      .withMessage('requestId must be a valid Mongo ID'),
    body('reason')
      .optional()
      .trim()
      .isLength({ max: 120 })
      .withMessage('reason must be at most 120 characters'),
    handleValidationErrors,
  ],
  cobblerSetActualCostValidation: [
    body('requestId')
      .notEmpty()
      .withMessage('requestId is required')
      .isMongoId()
      .withMessage('requestId must be a valid Mongo ID'),
    body('actualCost')
      .notEmpty()
      .withMessage('actualCost is required')
      .isFloat({ min: 0 })
      .withMessage('actualCost must be a non-negative number'),
    handleValidationErrors,
  ],
  getServiceRequestDetailsValidation: [
    param('requestId')
      .notEmpty()
      .withMessage('requestId is required')
      .isMongoId()
      .withMessage('requestId must be a valid Mongo ID'),
    handleValidationErrors,
  ],
  assignDeliveryValidation: [
    body('requestId')
      .notEmpty()
      .withMessage('requestId is required')
      .isMongoId()
      .withMessage('requestId must be a valid Mongo ID'),
    body('deliveryPartnerId')
      .optional()
      .isMongoId()
      .withMessage('deliveryPartnerId must be a valid Mongo ID'),
    handleValidationErrors,
  ],
  assignDarkStoreValidation: [
    body('requestId')
      .notEmpty()
      .withMessage('requestId is required')
      .isMongoId()
      .withMessage('requestId must be a valid Mongo ID'),
    body('darkStoreId')
      .trim()
      .notEmpty()
      .withMessage('darkStoreId is required')
      .isLength({ max: 80 })
      .withMessage('darkStoreId must be at most 80 characters'),
    body('darkStoreName')
      .optional()
      .trim()
      .isLength({ max: 160 })
      .withMessage('darkStoreName must be at most 160 characters'),
    body('routingType')
      .optional()
      .isIn(['dark_store', 'direct'])
      .withMessage('routingType must be one of: dark_store, direct'),
    handleValidationErrors,
  ],
  updateServiceStatusValidation: [
    body('requestId')
      .notEmpty()
      .withMessage('requestId is required')
      .isMongoId()
      .withMessage('requestId must be a valid Mongo ID'),
    body('status')
      .trim()
      .notEmpty()
      .withMessage('status is required')
      .isIn(serviceStatuses)
      .withMessage(`status must be one of: ${serviceStatuses.join(', ')}`),
    body('state')
      .optional()
      .trim()
      .isIn(serviceTrackingStates)
      .withMessage(`state must be one of: ${serviceTrackingStates.join(', ')}`),
    body('note')
      .optional()
      .trim()
      .isLength({ max: 250 })
      .withMessage('note must be at most 250 characters'),
    body('cobblerId')
      .optional()
      .isMongoId()
      .withMessage('cobblerId must be a valid Mongo ID'),
    body('actorType')
      .optional()
      .isIn(['system', 'customer', 'delivery', 'dark_store', 'cobbler', 'admin'])
      .withMessage('actorType must be one of: system, customer, delivery, dark_store, cobbler, admin'),
    body('photos')
      .optional()
      .isArray()
      .withMessage('photos must be an array'),
    body('photos.*')
      .optional()
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Each photo must be a non-empty string'),
    body('videos')
      .optional()
      .isArray()
      .withMessage('videos must be an array'),
    body('videos.*')
      .optional()
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Each video must be a non-empty string'),
    handleValidationErrors,
  ],
  cancelServiceRequestValidation: [
    param('requestId')
      .notEmpty()
      .withMessage('requestId is required')
      .isMongoId()
      .withMessage('requestId must be a valid Mongo ID'),
    handleValidationErrors,
  ],
  respondToActualCostValidation: [
    body('requestId')
      .notEmpty()
      .withMessage('requestId is required')
      .isMongoId()
      .withMessage('requestId must be a valid Mongo ID'),
    body('decision')
      .trim()
      .notEmpty()
      .withMessage('decision is required')
      .isIn(['accept', 'reject'])
      .withMessage('decision must be accept or reject'),
    handleValidationErrors,
  ],
  uploadServiceMediaValidation: [
    body('requestId')
      .notEmpty()
      .withMessage('requestId is required')
      .isMongoId()
      .withMessage('requestId must be a valid Mongo ID'),
    body('state')
      .optional()
      .trim()
      .isIn([...serviceTrackingStates, 'media_uploaded'])
      .withMessage(`state must be one of: ${[...serviceTrackingStates, 'media_uploaded'].join(', ')}`),
    body('note')
      .optional()
      .trim()
      .isLength({ max: 250 })
      .withMessage('note must be at most 250 characters'),
    body('actorType')
      .optional()
      .isIn(['system', 'customer', 'delivery', 'dark_store', 'cobbler', 'admin'])
      .withMessage('actorType must be one of: system, customer, delivery, dark_store, cobbler, admin'),
    body('photos')
      .optional()
      .isArray()
      .withMessage('photos must be an array'),
    body('photos.*')
      .optional()
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Each photo must be a non-empty string'),
    body('videos')
      .optional()
      .isArray()
      .withMessage('videos must be an array'),
    body('videos.*')
      .optional()
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Each video must be a non-empty string'),
    handleValidationErrors,
  ],
};

