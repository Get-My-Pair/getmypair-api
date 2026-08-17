/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : validators.js
 * Description: Shared validators – email, Indian mobile (exactly 10 digits), name (letters only), handleValidationErrors
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

const { body, validationResult } = require('express-validator');

/**
 * Custom email validator
 */
const isValidEmail = (value) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
};

/**
 * Extract the 10-digit local Indian mobile number.
 * Accepts 9876543210 or +919876543210 / 919876543210.
 */
const getLocalMobileDigits = (value) => {
  if (!value || typeof value !== 'string') {
    return '';
  }
  let digits = value.trim().replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  }
  return digits;
};

/**
 * Indian mobile: exactly 10 digits, starting with 6-9.
 * Optional +91 / 91 country code is allowed only when the local number is 10 digits.
 */
const isValidIndianMobile = (value) => {
  const local = getLocalMobileDigits(value);
  return /^[6-9]\d{9}$/.test(local);
};

/**
 * Custom phone validator
 * Auth APIs require exactly 10 Indian mobile digits (optional +91).
 */
const isValidPhone = (value) => isValidIndianMobile(value);

/**
 * Custom name validator - only letters and spaces (no special characters or numbers)
 */
const isValidName = (value) => {
  if (!value || typeof value !== 'string') {
    return false;
  }
  const trimmed = value.trim();
  if (trimmed.length < 2 || trimmed.length > 100) {
    return false;
  }
  const nameRegex = /^[a-zA-Z\s]+$/;
  return nameRegex.test(trimmed);
};

/**
 * City / state: letters and spaces only (no digits or special characters)
 */
const isValidCityStateName = (value) => {
  if (!value || typeof value !== 'string') {
    return false;
  }
  const trimmed = value.trim();
  if (!trimmed.length || trimmed.length > 100) {
    return false;
  }
  return /^[a-zA-Z\s]+$/.test(trimmed);
};

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
    }));

    // Log validation errors for debugging
    const logger = require('./logger');
    logger.warn(`Validation errors for ${req.path}:`, formattedErrors);
    logger.warn(`Request body:`, req.body);

    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: formattedErrors,
      statusCode: 400,
    });
  }
  next();
};

module.exports = {
  isValidEmail,
  isValidPhone,
  isValidIndianMobile,
  getLocalMobileDigits,
  isValidName,
  isValidCityStateName,
  handleValidationErrors,
};
