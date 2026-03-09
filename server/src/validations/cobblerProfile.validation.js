/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : cobblerProfile.validation.js
 * Description: Cobbler profile validation – create, update, booth, services, tools
 * ----------------------------------------------------------------------------
 * Developer  : C Ranjith Kumar
 * LinkedIn         : https://www.linkedin.com/in/coding-ranjith/
 * Personal GitHub  : https://github.com/CodingRanjith
 * Project GitHub   : https://github.com/Ranjithgmp
 * Personal Email   : ranjith.c96me@gmail.com
 * Project Email    : ranjith.kumar@getmypair.com
 * ----------------------------------------------------------------------------
 * Last modified : 2025-03-03
 * ----------------------------------------------------------------------------
 */

const { body } = require('express-validator');
const { isValidPhone, isValidName, handleValidationErrors } = require('../utils/validators');

// Allowed cobbler services (must match app: Repair, Maintenance, Wash, Donate, Dispose)
const ALLOWED_SERVICES = ['Repair', 'Maintenance', 'Wash', 'Donate', 'Dispose'];

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
    body('shopName').optional().trim().isLength({ max: 200 }),
    body('shopAddress').optional().trim().isLength({ max: 500 }),
    body('servicesOffered')
        .optional()
        .isArray()
        .withMessage('servicesOffered must be an array')
        .custom((arr) => {
            if (!Array.isArray(arr)) return true;
            const invalid = arr.find((s) => typeof s !== 'string' || !ALLOWED_SERVICES.includes(s));
            if (invalid !== undefined) {
                throw new Error(`Each service must be one of: ${ALLOWED_SERVICES.join(', ')}`);
            }
            return true;
        }),
    body('serviceAreas').optional().isArray(),
    body('toolsOwned').optional().isArray(),
    body('toolsNeeded').optional().isArray(),
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

// Update booth details validation (Booth name with number, Booth address)
const updateShopValidation = [
    body('shopName')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Booth name with number must be less than 200 characters'),
    body('shopAddress')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Booth address must be less than 500 characters'),
    handleValidationErrors,
];

// Update services validation (servicesOffered: Repair, Maintenance, Wash, Donate, Dispose)
const updateServicesValidation = [
    body('servicesOffered')
        .optional()
        .isArray()
        .withMessage('servicesOffered must be an array')
        .custom((arr) => {
            if (!Array.isArray(arr)) return true;
            const invalid = arr.find((s) => typeof s !== 'string' || !ALLOWED_SERVICES.includes(s));
            if (invalid !== undefined) {
                throw new Error(`Each service must be one of: ${ALLOWED_SERVICES.join(', ')}`);
            }
            return true;
        }),
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

// Update bank details validation
const updateBankValidation = [
    body('accountHolderName')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Account holder name must be less than 100 characters'),
    body('accountNumber')
        .optional()
        .trim()
        .isLength({ max: 34 })
        .withMessage('Account number must be less than 34 characters'),
    body('ifscCode')
        .optional()
        .trim()
        .isLength({ max: 11 })
        .withMessage('IFSC code must be less than 11 characters'),
    body('bankName')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Bank name must be less than 200 characters'),
    handleValidationErrors,
];

const updateStatusValidation = [
    body('isOnline')
        .optional()
        .isBoolean()
        .withMessage('isOnline must be a boolean'),
    handleValidationErrors,
];

module.exports = {
    createProfileValidation,
    updateProfileValidation,
    updateShopValidation,
    updateServicesValidation,
    updateToolsValidation,
    updateToolsNeededValidation,
    updateBankValidation,
    updateStatusValidation,
};
