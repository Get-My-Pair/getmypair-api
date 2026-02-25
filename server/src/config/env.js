require('dotenv').config();

const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb+srv://kartiPChess:kartiChess%402026@cluster-001.6pvjgt0.mongodb.net/kpcomm?retryWrites=true&w=majority',
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production',
  JWT_REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE || '30d',
  OTP_EXPIRE_MINUTES: parseInt(process.env.OTP_EXPIRE_MINUTES) || 10,
  OTP_LENGTH: parseInt(process.env.OTP_LENGTH) || 6,
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT) || 587,
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  MAX_LOGIN_ATTEMPTS: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
  LOCKOUT_DURATION_MINUTES: parseInt(process.env.LOCKOUT_DURATION_MINUTES) || 30,

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || 'gmp_root',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '129882573636256',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || 'TrCNS7gLoZ3JyWQKC4ACCx68NjA',
};

if (config.NODE_ENV === 'production') {
  const required = ['MONGODB_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

module.exports = config;