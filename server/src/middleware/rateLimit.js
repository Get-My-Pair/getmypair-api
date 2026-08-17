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
const { getLocalMobileDigits } = require('../utils/validators');

const isNonProduction = config.NODE_ENV !== 'production';

const OTP_WINDOW_MS = 15 * 60 * 1000;
const OTP_SEND_MAX = 5;

const otpLimitMessage = (message) => ({
  success: false,
  message,
  statusCode: 429,
});

const mobileKey = (prefix, req) => {
  const mobile = getLocalMobileDigits(req.body?.mobile || '');
  return `${prefix}:${mobile || req.ip}`;
};

// Global rate limiter
const globalRateLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
    statusCode: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
  /** Master admin dashboard polls/lists heavily in dev; do not throttle these JWT-protected routes here. */
  skip: (req) => {
    if (req.method === 'OPTIONS') return true;
    if (isNonProduction) return true;
    const p = req.path || '';
    return p.startsWith('/api/sys-admin')
      || p.startsWith('/api/masteradmin')
      || p.startsWith('/api/darkworkstore');
  },
});

// Send OTP – 5 requests per 15 minutes per mobile number (all environments)
const otpSendRateLimiter = rateLimit({
  windowMs: OTP_WINDOW_MS,
  max: OTP_SEND_MAX,
  message: otpLimitMessage('Too many OTP requests, please try again later.'),
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
  skipSuccessfulRequests: false,
  keyGenerator: (req) => mobileKey('otp-send', req),
  validate: false,
});

/** @deprecated Use otpSendRateLimiter */
const otpRateLimiter = otpSendRateLimiter;

/** Masteradmin / Darkworkstore login — global limiter skips those prefixes, so login stays protected */
const adminLoginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isNonProduction ? 100000 : 10,
  message: {
    success: false,
    message: 'Too many login attempts, please try again later.',
    statusCode: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isNonProduction,
});

module.exports = {
  globalRateLimiter,
  otpRateLimiter,
  otpSendRateLimiter,
  adminLoginRateLimiter,
};