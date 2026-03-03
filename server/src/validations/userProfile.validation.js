const { body } = require('express-validator');
const { isValidPhone, isValidEmail, isValidName, handleValidationErrors } = require('../utils/validators');

// Create profile validation
const createProfileValidation = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters')
        .custom((value) => {
            if (!isValidName(value)) {
                throw new Error('Name must contain only letters (no special characters or numbers)');
            }
            return true;
        }),
    body('phone')
        .trim()
        .notEmpty()
        .withMessage('Phone is required')
        .custom((value) => {
            const digitsOnly = (value || '').replace(/\D/g, '');
            if (digitsOnly.length < 10) {
                throw new Error('Phone number must be at least 10 digits');
            }
            if (!isValidPhone(value)) {
                throw new Error('Please provide a valid phone number');
            }
            return true;
        }),
    body('email')
        .optional()
        .trim()
        .custom((value) => {
            if (value && !isValidEmail(value)) {
                throw new Error('Please provide a valid email address');
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
        .withMessage('Name must be between 2 and 100 characters')
        .custom((value) => {
            if (value && !isValidName(value)) {
                throw new Error('Name must contain only letters (no special characters or numbers)');
            }
            return true;
        }),
    body('email')
        .optional()
        .trim()
        .custom((value) => {
            if (value && !isValidEmail(value)) {
                throw new Error('Please provide a valid email address');
            }
            return true;
        }),
    handleValidationErrors,
];

// Add address validation
const addAddressValidation = [
    body('addressLine1')
        .trim()
        .notEmpty()
        .withMessage('Address line 1 is required')
        .isLength({ max: 500 })
        .withMessage('Address line 1 must be less than 500 characters'),
    body('city')
        .trim()
        .notEmpty()
        .withMessage('City is required')
        .isLength({ max: 100 })
        .withMessage('City must be less than 100 characters'),
    body('state')
        .trim()
        .notEmpty()
        .withMessage('State is required')
        .isLength({ max: 100 })
        .withMessage('State must be less than 100 characters'),
    body('pincode')
        .trim()
        .notEmpty()
        .withMessage('Pincode is required')
        .matches(/^\d{4,10}$/)
        .withMessage('Pincode must be 4 to 10 digits'),
    handleValidationErrors,
];

// Update address validation
const updateAddressValidation = [
    body('addressId')
        .notEmpty()
        .withMessage('addressId is required'),
    body('addressLine1')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Address line 1 must be less than 500 characters'),
    body('city')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('City must be less than 100 characters'),
    body('state')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('State must be less than 100 characters'),
    body('pincode')
        .optional()
        .trim()
        .matches(/^\d{4,10}$/)
        .withMessage('Pincode must be 4 to 10 digits'),
    handleValidationErrors,
];

module.exports = {
    createProfileValidation,
    updateProfileValidation,
    addAddressValidation,
    updateAddressValidation,
};
