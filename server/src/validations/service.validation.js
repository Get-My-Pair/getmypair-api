/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : service.validation.js
 * Description: Service Request validation – create
 * ----------------------------------------------------------------------------
 */

const { body } = require('express-validator');
const { handleValidationErrors } = require('../utils/validators');
const { serviceTypes } = require('../models/serviceRequest.model');

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
  handleValidationErrors,
];

module.exports = {
  createServiceRequestValidation,
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
};

