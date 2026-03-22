/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : rateLimit.js
 * Description: Rate limiters – global and OTP-specific
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
  /** Master admin dashboard polls/lists heavily in dev; do not throttle these JWT-protected routes here. */
  skip: (req) => {
    const p = req.path || '';
    return p.startsWith('/api/sys-admin');
  },
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

/** Master admin login — global limiter skips /api/sys-admin, so login stays protected */
const adminLoginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.NODE_ENV === 'development' ? 30 : 10,
  message: {
    success: false,
    message: 'Too many login attempts, please try again later.',
    statusCode: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  globalRateLimiter,
  otpRateLimiter,
  adminLoginRateLimiter,
};