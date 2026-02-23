const { body } = require('express-validator');
const { handleValidationErrors } = require('../utils/validators');

// Verify profile validation
const verifyProfileValidation = [
    body('profileId')
        .notEmpty()
        .withMessage('profileId is required'),
    body('status')
        .notEmpty()
        .withMessage('status is required')
        .isIn(['pending', 'verified', 'rejected'])
        .withMessage('status must be one of: pending, verified, rejected'),
    handleValidationErrors,
];

// Update account status validation
const updateStatusValidation = [
    body('userId')
        .notEmpty()
        .withMessage('userId is required'),
    body('isActive')
        .notEmpty()
        .withMessage('isActive is required')
        .isBoolean()
        .withMessage('isActive must be a boolean'),
    handleValidationErrors,
];

module.exports = {
    verifyProfileValidation,
    updateStatusValidation,
};
