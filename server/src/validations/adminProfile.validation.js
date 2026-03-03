/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : adminProfile.validation.js
 * Description: Admin validation – verify profile, update account status
 * ----------------------------------------------------------------------------
 * Developer  : C Ranjith Kumar
 * Role       : Backend and Database Developer, Team Lead
 * ----------------------------------------------------------------------------
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
