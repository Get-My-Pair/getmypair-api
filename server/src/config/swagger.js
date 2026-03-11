/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : swagger.js
 * Description: OpenAPI/Swagger spec – servers, schemas, tags; built from docs
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

const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');
const config = require('./env');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'GetMyPair API',
      version: '1.0.0',
      description:
        'GetMyPair – A comprehensive API for shoe repair marketplace. Includes Authentication (Module 1) and Profile Management (Module 2) for Users, Cobblers, Delivery Partners, and Admins.',
      contact: {
        name: 'API Support',
      },
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
          description: 'Enter your JWT access token',
        },
      },
      schemas: {
        // ─── Auth User ──────────────────────────────────
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'User ID', example: '664a1b2c3d4e5f6a7b8c9d0e' },
            mobile: { type: 'string', description: 'User mobile number', example: '+919876543210' },
            name: { type: 'string', description: 'User full name', example: 'John Doe' },
            dateOfBirth: { type: 'string', format: 'date', description: 'Date of birth', example: '1995-06-15' },
            gender: { type: 'string', enum: ['male', 'female', 'other'], description: 'Gender' },
            email: { type: 'string', format: 'email', description: 'Email (optional)', example: 'john@example.com' },
            isPhoneVerified: { type: 'boolean', description: 'Phone verification status', example: true },
            isActive: { type: 'boolean', description: 'Account active status', example: true },
            role: { type: 'object', description: 'User role' },
            lastLogin: { type: 'string', format: 'date-time', description: 'Last login timestamp' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },

        // ─── Address Sub-Document ───────────────────────
        Address: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '664a1b2c3d4e5f6a7b8c9d10' },
            addressLine1: { type: 'string', example: '123 Main Street' },
            city: { type: 'string', example: 'Mumbai' },
            state: { type: 'string', example: 'Maharashtra' },
            pincode: { type: 'string', example: '400001' },
          },
        },

        // ─── User Profile ───────────────────────────────
        UserProfile: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '664a1b2c3d4e5f6a7b8c9d0e' },
            userId: { type: 'string', example: '664a1b2c3d4e5f6a7b8c9d01' },
            name: { type: 'string', example: 'John Doe' },
            phone: { type: 'string', example: '9876543210' },
            email: { type: 'string', example: 'john@example.com' },
            profileImage: { type: 'string', example: 'https://res.cloudinary.com/xxx/image/upload/v1/getmypair/profiles/user-xxx.jpg' },
            addresses: {
              type: 'array',
              items: { $ref: '#/components/schemas/Address' },
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },

        // ─── KYC Document Sub-Document ──────────────────
        KycDocument: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '664a1b2c3d4e5f6a7b8c9d11' },
            docType: { type: 'string', enum: ['aadhaar', 'pan', 'voter_id', 'driving_license', 'other'], example: 'aadhaar' },
            docUrl: { type: 'string', example: 'https://res.cloudinary.com/xxx/image/upload/v1/getmypair/kyc/kyc-xxx.jpg' },
            uploadedAt: { type: 'string', format: 'date-time' },
          },
        },

        // ─── Cobbler Profile ────────────────────────────
        CobblerProfile: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '664a1b2c3d4e5f6a7b8c9d0e' },
            userId: { type: 'string', example: '664a1b2c3d4e5f6a7b8c9d01' },
            name: { type: 'string', example: 'Raju Cobbler' },
            phone: { type: 'string', example: '9876543210' },
            profileImage: { type: 'string', example: 'https://res.cloudinary.com/xxx/image/upload/v1/getmypair/profiles/cobbler-xxx.jpg' },
            shopName: { type: 'string', description: 'Booth name with number', example: 'Booth 12, Stall 5' },
            shopAddress: { type: 'string', description: 'Booth address', example: '123 Main Street, Delhi' },
            serviceAreas: { type: 'array', items: { type: 'string' }, example: ['Connaught Place', 'Karol Bagh'] },
            servicesOffered: { type: 'array', items: { type: 'string', enum: ['Repair', 'Maintenance', 'Wash', 'Donate', 'Dispose'] }, example: ['Repair', 'Maintenance', 'Wash'] },
            toolsOwned: { type: 'array', items: { type: 'string' }, example: ['hammer', 'needle', 'thread'] },
            toolsNeeded: { type: 'array', items: { type: 'string' }, example: ['shoe stretcher', 'edge trimmer'] },
            kycDocs: { type: 'array', items: { $ref: '#/components/schemas/KycDocument' } },
            verificationStatus: { type: 'string', enum: ['pending', 'verified', 'rejected'], example: 'pending' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },

        // ─── Delivery Document Sub-Document ─────────────
        DeliveryDocument: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '664a1b2c3d4e5f6a7b8c9d12' },
            docType: { type: 'string', enum: ['aadhaar', 'pan', 'driving_license', 'vehicle_rc', 'insurance', 'other'], example: 'driving_license' },
            docUrl: { type: 'string', example: 'https://res.cloudinary.com/xxx/image/upload/v1/getmypair/documents/doc-xxx.jpg' },
            uploadedAt: { type: 'string', format: 'date-time' },
          },
        },

        // ─── Delivery Profile ───────────────────────────
        DeliveryProfile: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '664a1b2c3d4e5f6a7b8c9d0e' },
            userId: { type: 'string', example: '664a1b2c3d4e5f6a7b8c9d01' },
            name: { type: 'string', example: 'Suresh Kumar' },
            phone: { type: 'string', example: '9876543210' },
            profileImage: { type: 'string', example: 'https://res.cloudinary.com/xxx/image/upload/v1/getmypair/profiles/delivery-xxx.jpg' },
            vehicleType: { type: 'string', enum: ['bicycle', 'bike', 'scooter', 'auto', 'car', 'van', 'other'], example: 'bike' },
            vehicleNumber: { type: 'string', example: 'DL01AB1234' },
            documents: { type: 'array', items: { $ref: '#/components/schemas/DeliveryDocument' } },
            verificationStatus: { type: 'string', enum: ['pending', 'verified', 'rejected'], example: 'pending' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },

        // ─── Admin Profile ──────────────────────────────
        AdminProfile: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '664a1b2c3d4e5f6a7b8c9d0e' },
            userId: { type: 'string', example: '664a1b2c3d4e5f6a7b8c9d01' },
            name: { type: 'string', example: 'Admin User' },
            email: { type: 'string', example: 'admin@getmypair.com' },
            role: { type: 'string', example: 'super_admin' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },

        // ─── Article (Digital Shoe Passport) – Module 3 ──
        ArticleMaterial: {
          type: 'object',
          properties: {
            type: { type: 'string', example: 'rubber', description: 'Material type' },
            percentage: { type: 'integer', minimum: 0, maximum: 100, example: 40, description: 'Percentage (0–100)' },
          },
        },
        Article: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '664a1b2c3d4e5f6a7b8c9d20', description: 'Article ID' },
            ownerId: { type: 'string', example: '664a1b2c3d4e5f6a7b8c9d01', description: 'User ID (owner)' },
            brand: { type: 'string', example: 'Nike' },
            model: { type: 'string', example: 'Air Max 90' },
            category: {
              type: 'string',
              enum: ['sports_shoe', 'casual', 'formal', 'sandal', 'boot', 'slipper', 'other'],
              example: 'sports_shoe',
            },
            color: { type: 'string', example: 'black', nullable: true },
            purchaseYear: { type: 'integer', minimum: 1900, maximum: 2100, example: 2023, nullable: true },
            materials: {
              type: 'array',
              items: { $ref: '#/components/schemas/ArticleMaterial' },
              description: 'Material composition',
            },
            condition: {
              type: 'string',
              enum: ['excellent', 'good', 'fair', 'worn'],
              example: 'good',
            },
            images: {
              type: 'array',
              items: { type: 'string', format: 'uri' },
              example: ['https://res.cloudinary.com/xxx/image/upload/v1/getmypair/articles/shoe1.jpg'],
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },

        // ─── Common Responses ───────────────────────────
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation successful' },
            data: { type: 'object' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error message' },
            error: { type: 'string' },
          },
        },
        ValidationErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Validation failed' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string', example: 'name' },
                  message: { type: 'string', example: 'Name is required' },
                },
              },
            },
          },
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            total: { type: 'integer', example: 50 },
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 20 },
            totalPages: { type: 'integer', example: 3 },
          },
        },
        CloudinaryUploadResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'File uploaded successfully' },
            data: {
              type: 'object',
              properties: {
                profileImage: { type: 'string', example: 'https://res.cloudinary.com/xxx/image/upload/v1/getmypair/profiles/user-xxx.jpg' },
                cloudinaryId: { type: 'string', example: 'getmypair/profiles/user-xxx-1234567890' },
              },
            },
          },
        },
      },
    },
    tags: [
      { name: 'Health', description: 'Health check endpoints' },
      { name: 'Authentication', description: 'OTP-based authentication endpoints' },
      { name: 'User Profile', description: 'User profile management (7 APIs) — Role: USER' },
      { name: 'Articles', description: 'Article / Digital Shoe Passport (Module 3) — Role: USER' },
      { name: 'Cobbler Profile', description: 'Cobbler profile management (10 APIs) — Role: COBBER' },
      { name: 'Delivery Profile', description: 'Delivery partner profile management (7 APIs) — Role: DELIVERY' },
      { name: 'Admin Profile', description: 'Admin management APIs for all profiles (6 APIs) — Role: ADMIN' },
    ],
  },
  apis: [path.join(__dirname, '../docs/*.paths.js')],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
