/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : swagger.admin.js
 * Description: OpenAPI/Swagger spec – Master Admin Dashboard (sys-admin) only
 * ----------------------------------------------------------------------------
 */

const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');
const config = require('./env');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'GetMyPair – Admin APIs',
      version: '1.0.0',
      description:
        'Admin-only documentation: mobile ADMIN role APIs (/api/admin/...) and master admin HTML dashboard (/api/sys-admin/...).',
    },
    servers: [
      {
        url: `http://localhost:${config.PORT}`,
        description: 'Development (Local)',
      },
      {
        url: 'https://getmypair-api.onrender.com',
        description: 'Production',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT access token (mobile/web ADMIN role)',
        },
        adminBearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Master admin JWT access token (HTML dashboard)',
        },
      },
    },
  },
  apis: [
    path.join(__dirname, '../docs/adminProfile.paths.js'),
    path.join(__dirname, '../docs/adminDashboard.paths.js'),
  ],
};

module.exports = swaggerJsdoc(options);

