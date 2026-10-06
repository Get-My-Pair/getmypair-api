const { body } = require('express-validator');
const { handleValidationErrors } = require('../utils/validators');

const proofKeys = ['receipt', 'purchaseEmail', 'authenticityCard', 'boxLabel'];

const createSellListingValidation = [
  body('articleId').isMongoId().withMessage('A valid article is required'),
  body('footwearType')
    .trim()
    .isIn(['luxury', 'everyday'])
    .withMessage('Type of footwear must be Luxury or Everyday'),
  body('originalRetailPrice')
    .isFloat({ min: 1 })
    .withMessage('Original retail price is required'),
  body('basePrice').isFloat({ min: 1 }).withMessage('Base price is required'),
  body('conditionGrade')
    .trim()
    .isIn(['brand_new_in_box', 'like_new', 'gently_used'])
    .withMessage('Condition grading is required'),
  body('auctionStartDate').isISO8601().withMessage('Start date is required'),
  body('auctionEndDate')
    .isISO8601()
    .withMessage('End date is required')
    .custom((value, { req }) => {
      const start = new Date(req.body.auctionStartDate);
      const end = new Date(value);
      if (!(end > start)) {
        throw new Error('End date must be after the start date');
      }
      return true;
    }),
  body('proofs').custom((value) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error('Upload all authenticity photos');
    }
    return true;
  }),
  ...proofKeys.map((key) =>
    body(`proofs.${key}`)
      .isString()
      .trim()
      .isURL()
      .withMessage('Please upload images')
  ),
  handleValidationErrors,
];

module.exports = {
  createSellListingValidation,
  proofKeys,
};
