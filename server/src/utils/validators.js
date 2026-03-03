const { body, validationResult } = require('express-validator');

/**
 * Custom email validator
 */
const isValidEmail = (value) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
};

/**
 * Custom phone validator
 * Accepts: +1234567890 or 1234567890 (must have at least 10 digits, max 15)
 */
const isValidPhone = (value) => {
  if (!value || typeof value !== 'string') {
    return false;
  }
  const cleaned = value.trim();
  const digitsOnly = cleaned.replace(/\D/g, '');
  if (digitsOnly.length < 10) {
    return false;
  }
  if (digitsOnly.length > 15) {
    return false;
  }
  const phoneRegex = /^(\+?[1-9]\d{1,14}|[1-9]\d{9,14})$/;
  return phoneRegex.test(cleaned);
};

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
  isValidName,
  handleValidationErrors,
};
