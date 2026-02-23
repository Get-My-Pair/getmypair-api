const { body } = require('express-validator');
const { isValidPhone, handleValidationErrors } = require('../utils/validators');

// Create profile validation
const createProfileValidation = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),
    body('phone')
        .trim()
        .notEmpty()
        .withMessage('Phone is required')
        .custom((value) => {
            if (!isValidPhone(value)) {
                throw new Error('Please provide a valid phone number');
            }
            return true;
        }),
    handleValidationErrors,
];

// Update profile validation
const updateProfileValidation = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),
    body('phone')
        .optional()
        .trim()
        .custom((value) => {
            if (value && !isValidPhone(value)) {
                throw new Error('Please provide a valid phone number');
            }
            return true;
        }),
    handleValidationErrors,
];

// Update shop details validation
const updateShopValidation = [
    body('shopName')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Shop name must be less than 200 characters'),
    body('shopAddress')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Shop address must be less than 500 characters'),
    handleValidationErrors,
];

// Update services validation
const updateServicesValidation = [
    body('servicesOffered')
        .optional()
        .isArray()
        .withMessage('servicesOffered must be an array'),
    body('serviceAreas')
        .optional()
        .isArray()
        .withMessage('serviceAreas must be an array'),
    handleValidationErrors,
];

// Update tools validation
const updateToolsValidation = [
    body('toolsOwned')
        .optional()
        .isArray()
        .withMessage('toolsOwned must be an array'),
    handleValidationErrors,
];

// Update tools needed validation
const updateToolsNeededValidation = [
    body('toolsNeeded')
        .optional()
        .isArray()
        .withMessage('toolsNeeded must be an array'),
    handleValidationErrors,
];

module.exports = {
    createProfileValidation,
    updateProfileValidation,
    updateShopValidation,
    updateServicesValidation,
    updateToolsValidation,
    updateToolsNeededValidation,
};
