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

// Login rate limiter - stricter
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: {
    success: false,
    message: 'Too many login attempts, please try again later.',
    statusCode: 429,
  },
  skipSuccessfulRequests: true,
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

// Registration rate limiter
const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour
  message: {
    success: false,
    message: 'Too many registration attempts, please try again later.',
    statusCode: 429,
  },
});

module.exports = {
  globalRateLimiter,
  loginRateLimiter,
  otpRateLimiter,
  registerRateLimiter,
};