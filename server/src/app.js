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
const deliveryProfileRoutes = require('./routes/deliveryProfile.routes');
const adminProfileRoutes = require('./routes/adminProfile.routes');
const geocodeRoutes = require('./routes/geocode.routes');
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

// Global rate limiter
app.use(globalRateLimiter);

// Serve static files (HTML frontend)
const path = require('path');
app.use(express.static(path.join(__dirname, '../public')));

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
app.use('/api/delivery/profile', deliveryProfileRoutes);
app.use('/api/admin/profile', adminProfileRoutes);
// Geocoding (reverse lookup)
app.use('/api/geocode', geocodeRoutes);

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
