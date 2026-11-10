/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : errorHandler.js
 * Description: Global Express error handler – validation, JWT, Mongoose errors
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

const logger = require('../utils/logger');
const { error } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errorDetails = null;

  // body-parser: photo/data-URL body exceeded the JSON limit
  if (err.type === 'entity.too.large' || err.name === 'PayloadTooLargeError') {
    statusCode = 413;
    message = 'Photo is too large. Use a smaller image and try again.';
  }

  // body-parser: invalid JSON (e.g. {mobile: "…"} without quoted keys, or single quotes)
  if (
    err instanceof SyntaxError ||
    err.type === 'entity.parse.failed' ||
    (typeof err.message === 'string' &&
      err.message.includes('JSON') &&
      (err.status === 400 || err.statusCode === 400))
  ) {
    statusCode = 400;
    message =
      'Invalid JSON body. Use Content-Type: application/json with double-quoted keys, e.g. {"mobile":"+919876543210"}';
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    errorDetails = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 400;
    message = 'Duplicate field value entered';
    const field = Object.keys(err.keyPattern)[0];
    errorDetails = [{ field, message: `${field} already exists` }];
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Log error
  logger.error({
    message: err.message,
    stack: err.stack,
    statusCode,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  // Send error response
  return error(
    res,
    message,
    statusCode,
    process.env.NODE_ENV === 'development' ? err.stack : null,
    errorDetails
  );
};

module.exports = errorHandler;
