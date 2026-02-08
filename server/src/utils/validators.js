const validator = require('validator');

const validateEmail = (email) => {
  return validator.isEmail(email);
};

const validatePhone = (phone) => {
  // Basic phone validation - adjust regex based on your requirements
  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
  return phoneRegex.test(phone);
};

const validatePassword = (password) => {
  // At least 6 characters, can include letters, numbers, and special characters
  return password && password.length >= 6;
};

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return validator.escape(validator.trim(input));
};

const validateObjectId = (id) => {
  return validator.isMongoId(id);
};

module.exports = {
  validateEmail,
  validatePhone,
  validatePassword,
  sanitizeInput,
  validateObjectId,
};
