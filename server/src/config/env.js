require('dotenv').config();

const config = {
  // Server
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  dbUri: process.env.DB_URI || 'mongodb://localhost:27017/getmypair',
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  
  // OTP
  otpExpiresIn: parseInt(process.env.OTP_EXPIRES_IN) || 300, // 5 minutes in seconds
  otpLength: parseInt(process.env.OTP_LENGTH) || 6,
  
  // Rate Limiting
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100, // requests per window
  
  // Session
  sessionExpiresIn: parseInt(process.env.SESSION_EXPIRES_IN) || 7 * 24 * 60 * 60 * 1000, // 7 days
  
  // Security
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 10,
  
  // CORS
  corsOrigin: process.env.CORS_ORIGIN || '*',
};

module.exports = config;
