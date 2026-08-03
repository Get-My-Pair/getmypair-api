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
const { appSpecs, uiCss, buildHubHtml } = require('./config/swagger.apps');
const { globalRateLimiter } = require('./middleware/rateLimit');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth.routes');
const userProfileRoutes = require('./routes/userProfile.routes');
const userNotificationRoutes = require('./routes/userNotification.routes');
const cobblerProfileRoutes = require('./routes/cobblerProfile.routes');
const cobblerHomeRoutes = require('./routes/cobblerHome.routes');
const deliveryProfileRoutes = require('./routes/deliveryProfile.routes');
const adminProfileRoutes = require('./routes/adminProfile.routes');
const retailerRoutes = require('./routes/retailer.routes');
const geocodeRoutes = require('./routes/geocode.routes');
const articleRoutes = require('./routes/article.routes');
const serviceRoutes = require('./routes/service.routes');
const paymentRoutes = require('./routes/payment.routes');
const masteradminRoutes = require('./routes/masteradmin.routes');
const darkworkstoreRoutes = require('./routes/darkworkstore.routes');
const { notFound } = require('./utils/response');
const config = require('./config/env');
const pkg = require('../package.json');
const path = require('path');

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
    // Reflect request origin (required when credentials: true).
    return callback(null, origin);
  }
  const allowed = configured
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (allowed.includes(origin)) {
    return callback(null, origin);
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
      'Accept-Language',
      'X-App-Language',
      'device-info',
      'X-Requested-With',
    ],
    exposedHeaders: ['Content-Length', 'Content-Type'],
    optionsSuccessStatus: 204,
  })
);

// Zoho webhook must receive raw body for signature verification (before JSON parser)
const paymentController = require('./controllers/payment.controller');
app.post(
  '/api/payment/webhook/zoho',
  express.raw({ type: 'application/json' }),
  (req, res, next) => {
    req.rawBody = req.body?.toString?.() || '';
    try {
      req.body = req.rawBody ? JSON.parse(req.rawBody) : {};
    } catch {
      req.body = {};
    }
    next();
  },
  paymentController.zohoWebhook
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

// Global rate limiter (API routes; see skip in rateLimit.js for dashboard APIs)
app.use(globalRateLimiter);

// Per-app Swagger UIs (serveFiles avoids multi-mount conflicts with swagger-ui-express)
const swaggerUiOpts = (title) => ({
  customCss: uiCss,
  customSiteTitle: title,
});

[
  { route: '/api-docs/user', spec: appSpecs.user, title: 'GetMyPair User App APIs' },
  { route: '/api-docs/cobbler', spec: appSpecs.cobbler, title: 'GetMyPair Cobbler App APIs' },
  { route: '/api-docs/darkworkstore', spec: appSpecs.darkworkstore, title: 'GetMyPair Darkworkstore APIs' },
  { route: '/api-docs/masteradmin', spec: appSpecs.masteradmin, title: 'GetMyPair Masteradmin APIs' },
  { route: '/api-docs/retailer', spec: appSpecs.retailer, title: 'GetMyPair Retailer App APIs' },
  // Existing delivery APIs (not one of the five primary apps — kept for current mobile usage)
  { route: '/api-docs/delivery', spec: appSpecs.delivery, title: 'GetMyPair Delivery App APIs' },
  { route: '/api-docs/all', spec: swaggerSpec, title: 'GetMyPair API – Full Catalog' },
].forEach(({ route, spec, title }) => {
  app.use(route, swaggerUi.serveFiles(spec), swaggerUi.setup(spec, swaggerUiOpts(title)));
});

// Legacy Swagger alias
app.use(
  '/api-docs/admin',
  swaggerUi.serveFiles(appSpecs.masteradmin),
  swaggerUi.setup(appSpecs.masteradmin, swaggerUiOpts('GetMyPair Masteradmin APIs'))
);

// Hub index: app-wise module table with links to each Swagger
app.get(['/api-docs', '/api-docs/'], (req, res) => {
  const base = `${req.protocol}://${req.get('host')}`;
  res.type('html').send(buildHubHtml(base));
});

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

// ---------------------------------------------------------------------------
// Five primary app API surfaces
//   1. User          — /api/auth, /api/user/*, /api/articles, /api/geocode,
//                      /api/service, /api/payment (role-filtered)
//   2. Cobbler       — /api/auth, /api/cobbler/*, /api/service, /api/payment
//   3. Retailer      — /api/retailer (+ legacy /api/admin/profile)
//   4. Darkworkstore — /api/darkworkstore
//   5. Masteradmin   — /api/masteradmin
// Delivery profile APIs remain mounted for current mobile usage.
// ---------------------------------------------------------------------------

app.use('/api/auth', authRoutes);

// User app
app.use('/api/user/profile', userProfileRoutes);
app.use('/api/user/notifications', userNotificationRoutes);
app.use('/api/geocode', geocodeRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/service', serviceRoutes);
app.use('/api/payment', paymentRoutes);

// Cobbler app
app.use('/api/cobbler/profile', cobblerProfileRoutes);
app.use('/api/cobbler/home', cobblerHomeRoutes);

// Retailer app (canonical) + legacy mobile ADMIN mount
app.use('/api/retailer', retailerRoutes);
app.use('/api/admin/profile', adminProfileRoutes);

// Darkworkstore dashboard APIs
app.use('/api/darkworkstore', darkworkstoreRoutes);

// Masteradmin dashboard APIs
app.use('/api/masteradmin', masteradminRoutes);

// Legacy alias (prefer /api/masteradmin)
app.use('/api/sys-admin', masteradminRoutes);

// Delivery app (existing — not one of the five primary apps)
app.use('/api/delivery/profile', deliveryProfileRoutes);

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
