const { body } = require('express-validator');
const { isValidEmail, isValidPhone, handleValidationErrors } = require('../utils/validators');

// Register validation
const registerValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('firstName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('First name must be less than 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Last name must be less than 50 characters'),
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

// Login validation
const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors,
];

// Send OTP validation
const sendOTPValidation = [
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('phone')
    .optional()
    .trim()
    .custom((value) => {
      if (value && !isValidPhone(value)) {
        throw new Error('Please provide a valid phone number');
      }
      return true;
    }),
  body('type')
    .notEmpty()
    .withMessage('Type is required')
    .isIn(['email', 'phone'])
    .withMessage('Type must be either "email" or "phone"'),
  body().custom((value) => {
    if (!value.email && !value.phone) {
      throw new Error('Either email or phone is required');
    }
    if (value.type === 'email' && !value.email) {
      throw new Error('Email is required when type is "email"');
    }
    if (value.type === 'phone' && !value.phone) {
      throw new Error('Phone is required when type is "phone"');
    }
    return true;
  }),
  handleValidationErrors,
];

// Verify OTP validation
const verifyOTPValidation = [
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('phone')
    .optional()
    .trim()
    .custom((value) => {
      if (value && !isValidPhone(value)) {
        throw new Error('Please provide a valid phone number');
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
  body('type')
    .notEmpty()
    .withMessage('Type is required')
    .isIn(['email', 'phone'])
    .withMessage('Type must be either "email" or "phone"'),
  body().custom((value) => {
    if (!value.email && !value.phone) {
      throw new Error('Either email or phone is required');
    }
    if (value.type === 'email' && !value.email) {
      throw new Error('Email is required when type is "email"');
    }
    if (value.type === 'phone' && !value.phone) {
      throw new Error('Phone is required when type is "phone"');
    }
    return true;
  }),
  handleValidationErrors,
];

// Refresh token validation
const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required'),
  handleValidationErrors,
];

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

module.exports = {
  registerValidation,
  loginValidation,
  sendOTPValidation,
  verifyOTPValidation,
  refreshTokenValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  verifyMobileOTPValidation,
  completeMobileRegistrationValidation,
  updateProfileValidation,
};
