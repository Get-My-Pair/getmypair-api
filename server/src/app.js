/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : app.js
 * Description: Express app – middleware, routes, Swagger, error handling
 * ----------------------------------------------------------------------------
 * Developer  : C Ranjith Kumar
 * Role       : Backend and Database Developer, Team Lead
 * ----------------------------------------------------------------------------
 * LinkedIn         : https://www.linkedin.com/in/coding-ranjith/
 * Personal GitHub  : https://github.com/CodingRanjith
 * Project GitHub   : https://github.com/Ranjithgmp
 * Personal Email   : ranjith.c96me@gmail.com
 * Project Email    : ranjith.kumar@getmypair.com
 * ----------------------------------------------------------------------------
 * Last modified : 2025-03-03
 * ----------------------------------------------------------------------------
 */

const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const swaggerAdminSpec = require('./config/swagger.admin');
const { globalRateLimiter } = require('./middleware/rateLimit');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth.routes');
const userProfileRoutes = require('./routes/userProfile.routes');
const cobblerProfileRoutes = require('./routes/cobblerProfile.routes');
const cobblerHomeRoutes = require('./routes/cobblerHome.routes');
const deliveryProfileRoutes = require('./routes/deliveryProfile.routes');
const adminProfileRoutes = require('./routes/adminProfile.routes');
const geocodeRoutes = require('./routes/geocode.routes');
const articleRoutes = require('./routes/article.routes');
const serviceRoutes = require('./routes/service.routes');
const adminDashboardRoutes = require('./routes/adminDashboard.routes');
const { notFound } = require('./utils/response');
const config = require('./config/env');
const pkg = require('../package.json');

const app = express();

/**
 * CORS: Flutter web (localhost / hosted) calls this API cross-origin with cookies-like flows.
 * `credentials: true` cannot be combined with `origin: '*'` in the static cors config — browsers block it.
 * Use a dynamic origin that reflects the request origin when `CORS_ORIGIN=*`, or match a comma-separated allowlist.
 */
const corsOriginCallback = (origin, callback) => {
  const configured = String(config.CORS_ORIGIN || '*').trim();
  if (!origin) {
    return callback(null, true);
  }
  if (configured === '*') {
    return callback(null, true);
  }
  const allowed = configured
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (allowed.includes(origin)) {
    return callback(null, true);
  }
  return callback(null, false);
};

// Security middleware — allow cross-origin reads of API responses (Flutter web + mobile)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https:', 'http://localhost', 'http://127.0.0.1'],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'", 'https:'],
        frameSrc: ["'none'"],
      },
    },
  })
);

app.use(
  cors({
    origin: corsOriginCallback,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-App-Source',
      'X-App-Version',
      'Accept',
      'device-info',
      'X-Requested-With',
    ],
    exposedHeaders: ['Content-Length', 'Content-Type'],
    optionsSuccessStatus: 204,
  })
);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
if (config.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Static files BEFORE global rate limit — admin pages load many assets per view; throttling them caused 429 on /admin/*
const path = require('path');
app.use(express.static(path.join(__dirname, '../public')));
app.get('/admin', (req, res) => res.redirect(302, '/admin/'));

// Global rate limiter (API + dynamic routes only; see skip in rateLimit.js for /api/sys-admin)
app.use(globalRateLimiter);

// Swagger: register the narrower path first so /api-docs/admin is not swallowed by /api-docs
app.use('/api-docs/admin', swaggerUi.serve, swaggerUi.setup(swaggerAdminSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'GetMyPair Admin APIs',
}));

// Full API catalog (all path definitions in server/src/docs/*.paths.js)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'GetMyPair API Documentation',
}));

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    version: pkg.version,
  });
});

app.get('/api/version', (req, res) => {
  res.status(200).json({
    success: true,
    version: pkg.version,
    name: pkg.name,
  });
});

// API routes
app.use('/api/auth', authRoutes);

// Module 2: Profile APIs
app.use('/api/user/profile', userProfileRoutes);
app.use('/api/cobbler/profile', cobblerProfileRoutes);
app.use('/api/cobbler/home', cobblerHomeRoutes);
app.use('/api/delivery/profile', deliveryProfileRoutes);
app.use('/api/admin/profile', adminProfileRoutes);
// Geocoding (reverse lookup)
app.use('/api/geocode', geocodeRoutes);
// Module 3: Articles (Digital Shoe Passport)
app.use('/api/articles', articleRoutes);
// Module 4: Service Requests
app.use('/api/service', serviceRoutes);
// Master admin HTML dashboard APIs (separate from /api/admin/profile mobile ADMIN JWT)
app.use('/api/sys-admin', adminDashboardRoutes);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 404 handler
app.use((req, res) => {
  return notFound(res, 'Route not found');
});

// Error handler (must be last)
app.use(errorHandler);

module.exports = app;
// Trigger nodemon restart
