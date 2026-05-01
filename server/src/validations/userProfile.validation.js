/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : userProfile.validation.js
 * Description: User profile validation – update, add/update address
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
const { isValidEmail, isValidName, isValidCityStateName, handleValidationErrors } = require('../utils/validators');

const hasNonEmptyString = (v) => v !== undefined && v !== null && String(v).trim() !== '';

// Update profile validation
const updateProfileValidation = [
    body().custom((value, { req }) => {
        const b = req.body;
        if (!b || typeof b !== 'object' || Array.isArray(b)) {
            throw new Error('Please provide name or email to update');
        }
        const hasName = Object.prototype.hasOwnProperty.call(b, 'name') && hasNonEmptyString(b.name);
        const hasEmail = Object.prototype.hasOwnProperty.call(b, 'email') && hasNonEmptyString(b.email);
        if (!hasName && !hasEmail) {
            throw new Error('Please provide name or email to update');
        }
        return true;
    }),
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
        .withMessage('City must be less than 100 characters')
        .custom((value) => {
            if (!isValidCityStateName(value)) {
                throw new Error('Please provide a valid City name');
            }
            return true;
        }),
    body('state')
        .trim()
        .notEmpty()
        .withMessage('State is required')
        .isLength({ max: 100 })
        .withMessage('State must be less than 100 characters')
        .custom((value) => {
            if (!isValidCityStateName(value)) {
                throw new Error('Please provide a valid state name');
            }
            return true;
        }),
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
    body().custom((value, { req }) => {
        const b = req.body || {};
        const hasAddressLine1 = Object.prototype.hasOwnProperty.call(b, 'addressLine1') && hasNonEmptyString(b.addressLine1);
        const hasCity = Object.prototype.hasOwnProperty.call(b, 'city') && hasNonEmptyString(b.city);
        const hasState = Object.prototype.hasOwnProperty.call(b, 'state') && hasNonEmptyString(b.state);
        const hasPincode = Object.prototype.hasOwnProperty.call(b, 'pincode') && hasNonEmptyString(b.pincode);
        if (!hasAddressLine1 && !hasCity && !hasState && !hasPincode) {
            throw new Error('Please provide at least one address field to update');
        }
        return true;
    }),
    body('addressLine1')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Address line 1 must be less than 500 characters'),
    body('city')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('City must be less than 100 characters')
        .custom((value) => {
            if (value !== undefined && value !== null && String(value).trim() !== '' && !isValidCityStateName(String(value))) {
                throw new Error('Please provide a valid City name');
            }
            return true;
        }),
    body('state')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('State must be less than 100 characters')
        .custom((value) => {
            if (value !== undefined && value !== null && String(value).trim() !== '' && !isValidCityStateName(String(value))) {
                throw new Error('Please provide a valid state name');
            }
            return true;
        }),
    body('pincode')
        .optional()
        .trim()
        .matches(/^\d{4,10}$/)
        .withMessage('Pincode must be 4 to 10 digits'),
    handleValidationErrors,
];

module.exports = {
    updateProfileValidation,
    addAddressValidation,
    updateAddressValidation,
};
