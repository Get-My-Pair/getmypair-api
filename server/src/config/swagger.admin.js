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
      title: 'GetMyPair – Master Admin API',
      version: '1.0.0',
      description:
        'Master admin HTML dashboard APIs under /api/sys-admin. This is separate from mobile ADMIN role APIs.',
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
        adminBearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your master-admin JWT access token',
        },
      },
    },
  },
  apis: [path.join(__dirname, '../docs/adminDashboard.paths.js')],
};

module.exports = swaggerJsdoc(options);

