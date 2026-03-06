/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : response.js
 * Description: Standard API response helpers – success, error, notFound, forbidden, unauthorized
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

/**
 * Send success response
 * @param {Object} res - Express response object
 * @param {String} message - Success message
 * @param {Object} data - Response data
 * @param {Number} statusCode - HTTP status code
 */
const success = (res, message, data = null, statusCode = 200) => {
  const response = {
    success: true,
    message,
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @param {Number} statusCode - HTTP status code
 * @param {Object} error - Error details
 * @param {Array} errors - Validation errors array
 */
const error = (res, message, statusCode = 400, error = null, errors = null) => {
  const response = {
    success: false,
    message,
    statusCode,
  };

  if (error) {
    response.error = error;
  }

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send not found response
 * @param {Object} res - Express response object
 * @param {String} message - Not found message
 */
const notFound = (res, message = 'Resource not found') => {
  return error(res, message, 404);
};

/**
 * Send unauthorized response
 * @param {Object} res - Express response object
 * @param {String} message - Unauthorized message
 */
const unauthorized = (res, message = 'Unauthorized') => {
  return error(res, message, 401);
};

/**
 * Send forbidden response
 * @param {Object} res - Express response object
 * @param {String} message - Forbidden message
 */
const forbidden = (res, message = 'Forbidden') => {
  return error(res, message, 403);
};

module.exports = {
  success,
  error,
  notFound,
  unauthorized,
  forbidden,
};
