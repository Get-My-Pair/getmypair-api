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
 * Accepts: +1234567890 or 1234567890 (must start with 1-9, not 0)
 */
const isValidPhone = (value) => {
  if (!value || typeof value !== 'string') {
    return false;
  }
  // Remove any whitespace
  const cleaned = value.trim();
  // Accept + followed by 1-9 and digits, OR just 1-9 and digits (without +)
  const phoneRegex = /^(\+?[1-9]\d{1,14}|[1-9]\d{9,14})$/;
  return phoneRegex.test(cleaned);
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
  handleValidationErrors,
};
