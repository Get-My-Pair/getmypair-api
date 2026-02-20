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

<<<<<<< HEAD
// Forgot password validation
const forgotPasswordValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  handleValidationErrors,
];

// Mobile OTP verification validation
const verifyMobileOTPValidation = [
  body('mobile')
    .trim()
    .notEmpty()
    .withMessage('Mobile is required'),
  body('otp')
    .notEmpty()
    .withMessage('OTP is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits')
    .isNumeric()
    .withMessage('OTP must be numeric'),
  body('appSource')
    .optional()
    .isIn(['USER_APP', 'COBBER_APP', 'DELIVERY_APP', 'ADMIN_APP'])
    .withMessage('Invalid app source'),
  handleValidationErrors,
];

// Complete mobile registration validation
const completeMobileRegistrationValidation = [
  body('mobile')
    .trim()
    .notEmpty()
    .withMessage('Mobile is required'),
  body('otp')
    .notEmpty()
    .withMessage('OTP is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits')
    .isNumeric()
    .withMessage('OTP must be numeric'),
  body('appSource')
    .optional()
    .isIn(['USER_APP', 'COBBER_APP', 'DELIVERY_APP', 'ADMIN_APP'])
    .withMessage('Invalid app source'),
  body('firstName').optional().trim().isLength({ max: 50 }),
  body('lastName').optional().trim().isLength({ max: 50 }),
  body('dateOfBirth').optional().isISO8601().withMessage('Invalid date format'),
  body('gender').optional().isIn(['male', 'female', 'other', 'prefer_not_to_say']),
  body('location').optional().isObject(),
  body('location.lat').optional().isFloat({ min: -90, max: 90 }),
  body('location.lng').optional().isFloat({ min: -180, max: 180 }),
  body('location.address').optional().trim().isLength({ max: 500 }),
  handleValidationErrors,
];

// Profile update validation
const updateProfileValidation = [
  body('firstName').optional().trim().isLength({ max: 50 }),
  body('lastName').optional().trim().isLength({ max: 50 }),
  body('dateOfBirth').optional().isISO8601().withMessage('Invalid date format'),
  body('gender').optional().isIn(['male', 'female', 'other', 'prefer_not_to_say']),
  body('location').optional().isObject(),
  body('location.lat').optional().isFloat({ min: -90, max: 90 }),
  body('location.lng').optional().isFloat({ min: -180, max: 180 }),
  body('location.address').optional().trim().isLength({ max: 500 }),
  handleValidationErrors,
];

// Reset password validation
const resetPasswordValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('otp')
    .notEmpty()
    .withMessage('OTP is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits')
    .isNumeric()
    .withMessage('OTP must be numeric'),
  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  handleValidationErrors,
];

=======
>>>>>>> 87393ab8441ae77f9658bd8e2f32b2026e3272ac
module.exports = {
  sendOTPValidation,
  verifyOTPValidation,
  completeProfileValidation,
  refreshTokenValidation,
<<<<<<< HEAD
  forgotPasswordValidation,
  resetPasswordValidation,
  verifyMobileOTPValidation,
  completeMobileRegistrationValidation,
  updateProfileValidation,
=======
>>>>>>> 87393ab8441ae77f9658bd8e2f32b2026e3272ac
};
