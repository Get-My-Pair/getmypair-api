/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : article.validation.js
 * Description: Article (shoe) validation – create, update
 * ----------------------------------------------------------------------------
 */

const { body } = require('express-validator');
const { handleValidationErrors } = require('../utils/validators');

const categoryEnum = ['sports_shoe', 'casual', 'formal', 'sandal', 'boot', 'slipper', 'other'];
const conditionEnum = ['excellent', 'good', 'fair', 'worn', ''];

const createArticleValidation = [
  body('brand')
    .trim()
    .notEmpty()
    .withMessage('Brand is required')
    .isLength({ max: 120 })
    .withMessage('Brand must be at most 120 characters'),
  body('model')
    .trim()
    .notEmpty()
    .withMessage('Model is required')
    .isLength({ max: 120 })
    .withMessage('Model must be at most 120 characters'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required')
    .isIn(categoryEnum)
    .withMessage(`Category must be one of: ${categoryEnum.join(', ')}`),
  body('color')
    .optional()
    .trim()
    .isLength({ max: 60 })
    .withMessage('Color must be at most 60 characters'),
  body('purchaseYear')
    .optional()
    .isInt({ min: 1900, max: 2100 })
    .withMessage('Purchase year must be between 1900 and 2100'),
  body('condition')
    .optional()
    .trim()
    .isIn(conditionEnum)
    .withMessage(`Condition must be one of: ${conditionEnum.filter(Boolean).join(', ')}`),
  body('materials')
    .optional()
    .isArray()
    .withMessage('Materials must be an array'),
  body('materials.*.type')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Material type must be at most 100 characters'),
  body('materials.*.percentage')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Material percentage must be between 0 and 100'),
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array of URLs'),
  body('images.*')
    .optional()
    .isString()
    .trim()
    .isURL()
    .withMessage('Each image must be a valid URL'),
  handleValidationErrors,
];

/** Update: all fields optional (partial update) */
const updateArticleValidation = [
  body('brand')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Brand cannot be empty')
    .isLength({ max: 120 })
    .withMessage('Brand must be at most 120 characters'),
  body('model')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Model cannot be empty')
    .isLength({ max: 120 })
    .withMessage('Model must be at most 120 characters'),
  body('category')
    .optional()
    .trim()
    .isIn(categoryEnum)
    .withMessage(`Category must be one of: ${categoryEnum.join(', ')}`),
  body('color')
    .optional()
    .trim()
    .isLength({ max: 60 })
    .withMessage('Color must be at most 60 characters'),
  body('purchaseYear')
    .optional()
    .isInt({ min: 1900, max: 2100 })
    .withMessage('Purchase year must be between 1900 and 2100'),
  body('condition')
    .optional()
    .trim()
    .isIn(conditionEnum)
    .withMessage(`Condition must be one of: ${conditionEnum.filter(Boolean).join(', ')}`),
  body('materials')
    .optional()
    .isArray()
    .withMessage('Materials must be an array'),
  body('materials.*.type')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Material type must be at most 100 characters'),
  body('materials.*.percentage')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Material percentage must be between 0 and 100'),
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array of URLs'),
  body('images.*')
    .optional()
    .isString()
    .trim()
    .isURL()
    .withMessage('Each image must be a valid URL'),
  handleValidationErrors,
];

module.exports = {
  createArticleValidation,
  updateArticleValidation,
  categoryEnum,
  conditionEnum,
};
