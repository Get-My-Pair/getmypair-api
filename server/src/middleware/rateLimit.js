const rateLimit = require('express-rate-limit');
const config = require('../config/env');

const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: message || 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// General API rate limiter
const apiLimiter = createRateLimiter(
  config.rateLimitWindow,
  config.rateLimitMax,
  'Too many requests from this IP, please try again later.'
);

// Strict rate limiter for auth endpoints
const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // 5 requests per window
  'Too many authentication attempts, please try again later.'
);

// OTP rate limiter
const otpLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  3, // 3 OTP requests per window
  'Too many OTP requests, please try again later.'
);

module.exports = {
  apiLimiter,
  authLimiter,
  otpLimiter,
};
