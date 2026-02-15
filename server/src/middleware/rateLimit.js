const rateLimit = require('express-rate-limit');
const config = require('../config/env');

// Global rate limiter
const globalRateLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    statusCode: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// OTP rate limiter
const otpRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 OTP requests per hour
  message: {
    success: false,
    message: 'Too many OTP requests, please try again later.',
    statusCode: 429,
  },
});

module.exports = {
  globalRateLimiter,
  otpRateLimiter,
};