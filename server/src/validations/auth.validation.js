/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : auth.validation.js
 * Description: Auth request validation – send OTP, verify OTP, complete profile, refresh token
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
const { isValidIndianMobile, getLocalMobileDigits, isValidName, handleValidationErrors } = require('../utils/validators');
const { COBBLER_SUPPORTED_LANGUAGES } = require('../config/languages');

const assertExactTenDigitMobile = (value) => {
  const localDigits = getLocalMobileDigits(value);
  if (localDigits.length !== 10) {
    throw new Error('Mobile number must contain exactly 10 digits');
  }
  if (!isValidIndianMobile(value)) {
    throw new Error('Please provide a valid mobile number');
  }
  return true;
};

// Send OTP validation (mobile number only, exactly 10 digits)
const sendOTPValidation = [
  body('mobile')
    .trim()
    .notEmpty()
    .withMessage('Mobile number is required')
    .custom(assertExactTenDigitMobile),
  handleValidationErrors,
];

// Verify OTP validation
const verifyOTPValidation = [
  body('mobile')
    .trim()
    .notEmpty()
    .withMessage('Mobile number is required')
    .custom(assertExactTenDigitMobile),
  body('otp')
    .notEmpty()
    .withMessage('OTP is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits')
    .isNumeric()
    .withMessage('OTP must be numeric'),
  handleValidationErrors,
];

// Complete profile validation
const completeProfileValidation = [
  body('mobile')
    .trim()
    .notEmpty()
    .withMessage('Mobile number is required')
    .custom(assertExactTenDigitMobile),
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
  body('dateOfBirth')
    .notEmpty()
    .withMessage('Date of birth is required')
    .custom((value) => {
      if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new Error('Invalid date format');
      }

      const [year, month, day] = value.split('-').map(Number);
      const dob = new Date(year, month - 1, day);
      if (
        isNaN(dob.getTime()) ||
        dob.getFullYear() !== year ||
        dob.getMonth() !== month - 1 ||
        dob.getDate() !== day
      ) {
        throw new Error('Invalid date format');
      }
      
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const dobDate = new Date(dob.getFullYear(), dob.getMonth(), dob.getDate());
      if (dobDate > todayStart) {
        throw new Error('Date of birth cannot be in the future');
      }
      
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      
      if (age < 18) {
        throw new Error('You must be at least 18 years old');
      }
      if (age > 120) {
        throw new Error('Please provide a valid date of birth');
      }
      
      return true;
    }),
  body('gender')
    .trim()
    .notEmpty()
    .withMessage('Gender is required')
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be one of: male, female, other')
    .toLowerCase(),
  body('householdType')
    .optional()
    .trim()
    .isIn(['just_me', 'with_partner', 'with_children', 'with_elder'])
    .withMessage('householdType must be one of: just_me, with_partner, with_children, with_elder'),
  body('location').optional().isObject().withMessage('Location must be an object'),
  body('location.lat').optional().isFloat({ min: -90, max: 90 }),
  body('location.lng').optional().isFloat({ min: -180, max: 180 }),
  body('location.address').optional().trim().isLength({ max: 500 }),
  handleValidationErrors,
];

// Refresh token validation
const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required'),
  handleValidationErrors,
];

// Update preferred language (cobbler app: English and Kannada only)
const updateLanguageValidation = [
  body('preferredLanguage')
    .trim()
    .notEmpty()
    .withMessage('preferredLanguage is required')
    .isIn(COBBLER_SUPPORTED_LANGUAGES)
    .withMessage(`preferredLanguage must be one of: ${COBBLER_SUPPORTED_LANGUAGES.join(', ')}`)
    .toLowerCase(),
  handleValidationErrors,
];

module.exports = {
  sendOTPValidation,
  verifyOTPValidation,
  completeProfileValidation,
  refreshTokenValidation,
  updateLanguageValidation,
};
