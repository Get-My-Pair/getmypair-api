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
