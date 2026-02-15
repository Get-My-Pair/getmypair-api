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

// OTP rate limiter - more lenient for development
const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.NODE_ENV === 'development' ? 20 : 5, // 20 in dev, 5 in production
  message: {
    success: false,
    message: 'Too many OTP requests, please try again later.',
    statusCode: 429,
  },
  skipSuccessfulRequests: false,
});

module.exports = {
  globalRateLimiter,
  otpRateLimiter,
};