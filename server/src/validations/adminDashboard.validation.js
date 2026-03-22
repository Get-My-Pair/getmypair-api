/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : adminDashboard.validation.js
 * ----------------------------------------------------------------------------
 */

const { body } = require('express-validator');
const { handleValidationErrors } = require('../utils/validators');

const adminLoginValidation = [
  body('email').trim().notEmpty().withMessage('email is required').isEmail().withMessage('Invalid email'),
  body('password').notEmpty().withMessage('password is required'),
  handleValidationErrors,
];

module.exports = {
  adminLoginValidation,
};
