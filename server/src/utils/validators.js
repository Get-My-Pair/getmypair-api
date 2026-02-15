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
 */
const isValidPhone = (value) => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(value);
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
