/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : env.js
 * Description: Environment config – NODE_ENV, PORT, JWT, MongoDB, CORS, etc.
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

require('dotenv').config();

const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb+srv://kartiPChess:kartiChess%402026@cluster-001.6pvjgt0.mongodb.net/kpcomm?retryWrites=true&w=majority',
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '5m',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production',
  JWT_REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE || '7d',
  OTP_EXPIRE_MINUTES: parseInt(process.env.OTP_EXPIRE_MINUTES) || 5,
  OTP_LENGTH: parseInt(process.env.OTP_LENGTH) || 6,
  OTP_MAX_ATTEMPTS: parseInt(process.env.OTP_MAX_ATTEMPTS) || 3,
  /** Resend.com — preferred for portal OTP emails */
  RESEND_API_KEY: process.env.RESEND_API_KEY || '',
  /** Verified sender, e.g. "GetMyPair <noreply@yourdomain.com>" or onboarding@resend.dev for tests */
  RESEND_FROM_EMAIL:
    process.env.RESEND_FROM_EMAIL ||
    process.env.SMTP_FROM ||
    process.env.MAIL_FROM ||
    'GetMyPair <onboarding@resend.dev>',
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT) || 587,
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  /** When true, send-otp response includes OTP so the app can show it in a popup (for testing / no-SMS). */
  RETURN_OTP_IN_RESPONSE: process.env.RETURN_OTP_IN_RESPONSE === 'true' || process.env.RETURN_OTP_IN_RESPONSE === '1',
  MAX_LOGIN_ATTEMPTS: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
  LOCKOUT_DURATION_MINUTES: parseInt(process.env.LOCKOUT_DURATION_MINUTES) || 30,

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',

  /** Master admin HTML dashboard (/admin) – JWT lifetime */
  ADMIN_JWT_EXPIRE: process.env.ADMIN_JWT_EXPIRE || '12h',
  /** Seeded only if AdminMaster collection is empty; override in production via .env */
  MASTER_ADMIN_EMAIL: process.env.MASTER_ADMIN_EMAIL || 'ranjith.c96me@gmail.com',
  MASTER_ADMIN_PASSWORD: process.env.MASTER_ADMIN_PASSWORD || 'Admin@123',

  // Zoho Payments (OAuth — do not put Client ID in ZOHO_API_KEY)
  ZOHO_CLIENT_ID: process.env.ZOHO_CLIENT_ID || '',
  ZOHO_CLIENT_SECRET: process.env.ZOHO_CLIENT_SECRET || '',
  ZOHO_REFRESH_TOKEN: process.env.ZOHO_REFRESH_TOKEN || '',
  ZOHO_REDIRECT_URI: process.env.ZOHO_REDIRECT_URI || process.env.ZOHO_PAYMENT_RETURN_URL || '',
  ZOHO_ACCOUNTS_URL: process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.in',
  /** Optional static access token (expires ~1h). Prefer ZOHO_REFRESH_TOKEN for production. */
  ZOHO_API_KEY: process.env.ZOHO_API_KEY || '',
  ZOHO_ACCOUNT_ID: process.env.ZOHO_ACCOUNT_ID || '',
  ZOHO_PAYMENT_CURRENCY: process.env.ZOHO_PAYMENT_CURRENCY || 'INR',
  ZOHO_WEBHOOK_SECRET: process.env.ZOHO_WEBHOOK_SECRET || '',
  /** Signing key from Zoho Payments → Settings → Developer Space (return URL / widget verification). */
  ZOHO_SIGNING_KEY: process.env.ZOHO_SIGNING_KEY || '',
  ZOHO_PAYMENTS_BASE_URL: process.env.ZOHO_PAYMENTS_BASE_URL || 'https://payments.zoho.in/api/v1',
  ZOHO_PAYMENT_RETURN_URL: process.env.ZOHO_PAYMENT_RETURN_URL || '',
  ZOHO_PAYMENTS_MOCK: process.env.ZOHO_PAYMENTS_MOCK === 'true' || process.env.ZOHO_PAYMENTS_MOCK === '1',
  /** Zoho Payments sandbox credentials (used when app sends paymentMode=sandbox). */
  ZOHO_SANDBOX_CLIENT_ID: process.env.ZOHO_SANDBOX_CLIENT_ID || '',
  ZOHO_SANDBOX_CLIENT_SECRET: process.env.ZOHO_SANDBOX_CLIENT_SECRET || '',
  ZOHO_SANDBOX_REFRESH_TOKEN: process.env.ZOHO_SANDBOX_REFRESH_TOKEN || '',
  ZOHO_SANDBOX_ACCOUNT_ID: process.env.ZOHO_SANDBOX_ACCOUNT_ID || '',
  ZOHO_SANDBOX_API_KEY: process.env.ZOHO_SANDBOX_API_KEY || '',
  ZOHO_SANDBOX_PAYMENTS_BASE_URL:
    process.env.ZOHO_SANDBOX_PAYMENTS_BASE_URL || 'https://paymentssandbox.zoho.in/api/v1',
  ZOHO_SANDBOX_ACCOUNTS_URL: process.env.ZOHO_SANDBOX_ACCOUNTS_URL || '',
  API_PUBLIC_BASE_URL: process.env.API_PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3000}`,

  // Settlement scheduler
  SETTLEMENT_SCHEDULER_ENABLED:
    process.env.SETTLEMENT_SCHEDULER_ENABLED !== 'false' &&
    process.env.SETTLEMENT_SCHEDULER_ENABLED !== '0',
  SETTLEMENT_SCHEDULER_INTERVAL_MS:
    parseInt(process.env.SETTLEMENT_SCHEDULER_INTERVAL_MS, 10) || 60 * 60 * 1000,
};

if (config.NODE_ENV === 'production') {
  const required = ['MONGODB_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

module.exports = config;