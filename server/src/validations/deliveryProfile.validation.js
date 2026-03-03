const { body } = require('express-validator');
const { isValidPhone, isValidName, handleValidationErrors } = require('../utils/validators');

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
    body('phone')
        .optional()
        .trim()
        .custom((value) => {
            if (value) {
                const digitsOnly = value.replace(/\D/g, '');
                if (digitsOnly.length < 10) {
                    throw new Error('Phone number must be at least 10 digits');
                }
                if (!isValidPhone(value)) {
                    throw new Error('Please provide a valid phone number');
                }
            }
            return true;
        }),
    handleValidationErrors,
];

// Update vehicle details validation
const updateVehicleValidation = [
    body('vehicleType')
        .optional()
        .trim()
        .isIn(['bicycle', 'bike', 'scooter', 'auto', 'car', 'van', 'other'])
        .withMessage('vehicleType must be one of: bicycle, bike, scooter, auto, car, van, other'),
    body('vehicleNumber')
        .optional()
        .trim()
        .isLength({ max: 20 })
        .withMessage('Vehicle number must be less than 20 characters'),
    handleValidationErrors,
];

module.exports = {
    createProfileValidation,
    updateProfileValidation,
    updateVehicleValidation,
};
