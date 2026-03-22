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

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
  })
);

// CORS configuration
app.use(
  cors({
    origin: config.CORS_ORIGIN,
    credentials: true,
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

// Swagger API Documentation (path definitions in server/src/docs/*.paths.js)
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
