const { body } = require('express-validator');
const { isValidPhone, handleValidationErrors } = require('../utils/validators');

// Send OTP validation (mobile number only)
const sendOTPValidation = [
  body('mobile')
    .trim()
    .notEmpty()
    .withMessage('Mobile number is required')
    .custom((value) => {
      if (!isValidPhone(value)) {
        throw new Error('Please provide a valid mobile number');
      }
      return true;
    }),
  handleValidationErrors,
];

// Verify OTP validation
const verifyOTPValidation = [
  body('mobile')
    .trim()
    .notEmpty()
    .withMessage('Mobile number is required')
    .custom((value) => {
      if (!isValidPhone(value)) {
        throw new Error('Please provide a valid mobile number');
      }
      return true;
    }),
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
    .custom((value) => {
      if (!isValidPhone(value)) {
        throw new Error('Please provide a valid mobile number');
      }
      return true;
    }),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('dateOfBirth')
    .notEmpty()
    .withMessage('Date of birth is required')
    .custom((value) => {
      // Accept both YYYY-MM-DD and ISO 8601 formats
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(value) && !Date.parse(value)) {
        throw new Error('Please provide a valid date of birth (YYYY-MM-DD format)');
      }
      
      const dob = new Date(value);
      if (isNaN(dob.getTime())) {
        throw new Error('Please provide a valid date of birth');
      }
      
      const today = new Date();
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
  handleValidationErrors,
];

// Refresh token validation
const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required'),
  handleValidationErrors,
];

module.exports = {
  sendOTPValidation,
  verifyOTPValidation,
  completeProfileValidation,
  refreshTokenValidation,
};
