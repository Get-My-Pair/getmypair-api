/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : article.validation.js
 * Description: Article (shoe) validation – create, update
 * ----------------------------------------------------------------------------
 */

const { body } = require('express-validator');
const { handleValidationErrors } = require('../utils/validators');
const {
  isValidCategoryCode,
  slugifyCode,
} = require('../controllers/articleCategory.controller');

/** Fallback codes if Article DB is unreachable (matches canonical product list). */
const categoryEnum = [
  'formal_shoes',
  'casual_shoes',
  'sports_shoes',
  'safety_shoes',
  'leather_sandals',
  'flip_flops',
  'womens_heels',
  'boots',
  'childrens_shoes',
  'orthopedic_shoes',
  'traditional_footwear',
  // Legacy codes still accepted for older passports.
  'sports_shoe',
  'casual',
  'formal',
  'sandal',
  'boot',
  'flip_flop',
  'heel',
  'kids',
  'safety',
  'ethnic',
  'other',
];
const conditionEnum = ['excellent', 'good', 'fair', 'worn', ''];

async function assertActiveCategory(value) {
  const code = slugifyCode(value);
  if (!code) throw new Error('Category is required');
  try {
    const ok = await isValidCategoryCode(code);
    if (ok) return true;
  } catch (_) {
    // Fall through to static enum if DB check fails.
  }
  if (categoryEnum.includes(code)) return true;
  throw new Error('Category is not an active Article DB category');
}

const footwearTypeEnum = ['luxury', 'everyday'];

const updateArticleFieldKeys = ['brand', 'model', 'category', 'color', 'purchaseYear', 'condition', 'materials', 'images', 'shoeSize', 'footwearType'];

const createArticleValidation = [
  body('purchaseYear')
    .custom((value) => {
      if (value === null || value === undefined || value === '') {
        throw new Error('Purchase year is required and cannot be null');
      }
      const n = typeof value === 'string' ? parseInt(value, 10) : Number(value);
      if (!Number.isInteger(n) || n < 1900 || n > 2100) {
        throw new Error('Purchase year must be a valid integer between 1900 and 2100');
      }
      return true;
    }),
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
  body('footwearType')
    .optional()
    .trim()
    .isIn(footwearTypeEnum)
    .withMessage('Type of footwear must be Luxury or Everyday'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required')
    .custom(assertActiveCategory),
  body('color')
    .optional()
    .trim()
    .isLength({ max: 60 })
    .withMessage('Color must be at most 60 characters'),
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
  body('shoeSize')
    .optional()
    .trim()
    .isLength({ max: 32 })
    .withMessage('Shoe size must be at most 32 characters'),
  handleValidationErrors,
];

/** Update: partial update; at least one field required */
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
  body('footwearType')
    .optional()
    .trim()
    .isIn(footwearTypeEnum)
    .withMessage('Type of footwear must be Luxury or Everyday'),
  body('category')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Category cannot be empty')
    .custom(assertActiveCategory),
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
  body('shoeSize')
    .optional()
    .trim()
    .isLength({ max: 32 })
    .withMessage('Shoe size must be at most 32 characters'),
  body().custom((value, { req }) => {
    const b = req.body || {};
    const hasField = updateArticleFieldKeys.some((k) => Object.prototype.hasOwnProperty.call(b, k));
    if (!hasField) {
      throw new Error('Please provide at least one field to update');
    }
    return true;
  }),
  handleValidationErrors,
];

module.exports = {
  createArticleValidation,
  updateArticleValidation,
  categoryEnum,
  conditionEnum,
  footwearTypeEnum,
};
