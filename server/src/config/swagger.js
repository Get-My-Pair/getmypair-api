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
      description: `
GetMyPair API — full catalog for every app (User, Cobbler, Delivery, Retailer, Darkworkstore, Masteradmin).

### X-App / X-App-Source (mobile & retailer)

Send **X-App-Source** (canonical) or **X-App** (QA/Postman alias). Same allowed values. Required on \`POST /api/auth/complete-profile\`. Send it on \`send-otp\` / \`verify-otp\` too so the correct role is used.

| App | Header value | Role |
|-----|----------------|------|
| User (customer) | \`USER_APP\` | USER |
| Cobbler | \`COBBER_APP\` | COBBER |
| Delivery (mobile) | \`DELIVERY_APP\` | DELIVERY |

Spelling is **COBBER_APP** (not COBBLER_APP). Invalid or missing values on complete-profile are rejected.

**Darkworkstore** and **Masteradmin** dashboards do **not** use X-App — authorize with dashboard JWT (\`adminBearerAuth\`).
`,
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
          description: 'Mobile/web JWT access token (OTP complete-profile / login)',
        },
        adminBearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Dashboard JWT (Masteradmin, Darkworkstore, Delivery portal)',
        },
      },
      parameters: {
        XAppSource: {
          in: 'header',
          name: 'X-App-Source',
          required: false,
          schema: {
            type: 'string',
            enum: ['USER_APP', 'COBBER_APP', 'DELIVERY_APP', 'ADMIN_APP'],
            example: 'USER_APP',
          },
          description:
            'Canonical app identifier. USER_APP→USER, COBBER_APP→COBBER, DELIVERY_APP→DELIVERY, ADMIN_APP→ADMIN. Alias header **X-App** is also accepted. Required on complete-profile.',
        },
        XApp: {
          in: 'header',
          name: 'X-App',
          required: false,
          schema: {
            type: 'string',
            enum: ['USER_APP', 'COBBER_APP', 'DELIVERY_APP', 'ADMIN_APP'],
            example: 'USER_APP',
          },
          description: 'QA/Postman alias for **X-App-Source**. Same allowed values.',
        },
        XAppVersion: {
          in: 'header',
          name: 'X-App-Version',
          required: false,
          schema: { type: 'string', example: '1.0.0' },
          description: 'Client app version string',
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
            preferredLanguage: {
              type: 'string',
              enum: ['en', 'kn'],
              example: 'en',
              description: 'Preferred UI language (Cobbler app currently: English / Kannada)',
            },
            location: {
              type: 'object',
              nullable: true,
              properties: {
                lat: { type: 'number', example: 12.9716 },
                lng: { type: 'number', example: 77.5946 },
                address: { type: 'string', example: 'MG Road, Bengaluru' },
              },
            },
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

        FamilyMember: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '664a1b2c3d4e5f6a7b8c9d12' },
            name: { type: 'string', example: 'Jane Doe' },
            relation: { type: 'string', enum: ['partner', 'child', 'elder'], example: 'partner' },
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
            householdType: {
              type: 'string',
              enum: ['just_me', 'with_partner', 'with_children', 'with_elder'],
              example: 'with_partner',
              nullable: true,
            },
            addresses: {
              type: 'array',
              items: { $ref: '#/components/schemas/Address' },
            },
            familyMembers: {
              type: 'array',
              items: { $ref: '#/components/schemas/FamilyMember' },
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },

        UserNotification: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '664a1b2c3d4e5f6a7b8c9d30' },
            userId: { type: 'string', example: '664a1b2c3d4e5f6a7b8c9d01' },
            type: { type: 'string', example: 'COST_APPROVAL_PENDING' },
            title: { type: 'string', example: 'Cost approval required' },
            body: { type: 'string', example: 'Your cobbler quoted ₹650 for the repair.' },
            data: { type: 'object', example: { serviceRequestId: '664a1b2c3d4e5f6a7b8c9d99' } },
            readAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },

        GeocodeLocation: {
          type: 'object',
          properties: {
            displayName: { type: 'string', nullable: true, example: 'MG Road, Bengaluru, Karnataka, India' },
            houseNumber: { type: 'string', nullable: true },
            road: { type: 'string', nullable: true, example: 'MG Road' },
            neighbourhood: { type: 'string', nullable: true },
            suburb: { type: 'string', nullable: true },
            city: { type: 'string', nullable: true, example: 'Bengaluru' },
            county: { type: 'string', nullable: true },
            state: { type: 'string', nullable: true, example: 'Karnataka' },
            postcode: { type: 'string', nullable: true, example: '560001' },
            country: { type: 'string', nullable: true, example: 'India' },
            countryCode: { type: 'string', nullable: true, example: 'in' },
            lat: { type: 'string', example: '12.9716' },
            lon: { type: 'string', example: '77.5946' },
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
            darkStoreId: {
              type: 'string',
              nullable: true,
              description: 'Darkworkstore AdminMaster id if this cobbler is a store employee; null = independent',
              example: null,
            },
            shopName: { type: 'string', description: 'Booth name with number', example: 'Booth 12, Stall 5' },
            shopAddress: { type: 'string', description: 'Booth address', example: '123 Main Street, Delhi' },
            serviceAreas: { type: 'array', items: { type: 'string' }, example: ['Connaught Place', 'Karol Bagh'] },
            servicesOffered: { type: 'array', items: { type: 'string', enum: ['Repair', 'Maintenance', 'Wash', 'Donate', 'Dispose'] }, example: ['Repair', 'Maintenance', 'Wash'] },
            toolsOwned: { type: 'array', items: { type: 'string' }, example: ['hammer', 'needle', 'thread'] },
            toolsNeeded: { type: 'array', items: { type: 'string' }, example: ['shoe stretcher', 'edge trimmer'] },
            bankDetails: {
              type: 'object',
              nullable: true,
              properties: {
                accountHolderName: { type: 'string', example: 'Raju Cobbler' },
                accountNumber: { type: 'string', example: '123456789012' },
                ifscCode: { type: 'string', example: 'HDFC0001234' },
                bankName: { type: 'string', example: 'HDFC Bank' },
              },
            },
            kycDocs: { type: 'array', items: { $ref: '#/components/schemas/KycDocument' } },
            verificationStatus: { type: 'string', enum: ['pending', 'verified', 'rejected'], example: 'pending' },
            isOnline: { type: 'boolean', example: true },
            lastKnownLocation: {
              type: 'object',
              nullable: true,
              properties: {
                type: { type: 'string', enum: ['Point'], example: 'Point' },
                coordinates: {
                  type: 'array',
                  description: '[longitude, latitude]',
                  items: { type: 'number' },
                  minItems: 2,
                  maxItems: 2,
                  example: [77.5946, 12.9716],
                },
                updatedAt: { type: 'string', format: 'date-time', nullable: true },
              },
            },
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

        // ─── Service Request (Module 4) ─────────────────
        ServiceRequest: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '664a1b2c3d4e5f6a7b8c9d99' },
            userId: { type: 'string', example: '664a1b2c3d4e5f6a7b8c9d01' },
            articleId: { type: 'string', example: '664a1b2c3d4e5f6a7b8c9d20' },
            serviceType: { type: 'string', enum: ['repair', 'maintenance', 'wash', 'donate', 'dispose'], example: 'repair' },
            addressId: { type: 'string', example: '664a1b2c3d4e5f6a7b8c9d10' },
            deliveryPartnerId: { type: 'string', nullable: true, example: '664a1b2c3d4e5f6a7b8c9d77' },
            deliveryProfileId: { type: 'string', nullable: true, example: '664a1b2c3d4e5f6a7b8c9d88' },
            cobblerId: { type: 'string', nullable: true, example: '664a1b2c3d4e5f6a7b8c9d55' },
            cobblerProfileId: { type: 'string', nullable: true, example: '664a1b2c3d4e5f6a7b8c9d56' },
            cobblerAssignedAt: { type: 'string', format: 'date-time', nullable: true },
            cobblerDeclinedBy: { type: 'array', items: { type: 'string' } },
            pickupAssignedAt: { type: 'string', format: 'date-time', nullable: true },
            routingType: { type: 'string', enum: ['dark_store', 'direct'], example: 'dark_store' },
            darkStoreId: { type: 'string', nullable: true, example: 'STORE_21' },
            darkStoreName: { type: 'string', nullable: true, example: 'Dark Store - T Nagar' },
            darkStoreAssignedAt: { type: 'string', format: 'date-time', nullable: true },
            trackingState: { type: 'string', example: 'request_created' },
            trackingUpdatedAt: { type: 'string', format: 'date-time' },
            photos: { type: 'array', items: { type: 'string' } },
            videos: { type: 'array', items: { type: 'string' } },
            status: {
              type: 'string',
              enum: ['pending', 'pickup_assigned', 'in_service', 'completed', 'cancelled'],
              example: 'pending',
            },
            estimatedCost: { type: 'number', nullable: true, example: 500 },
            actualCost: { type: 'number', nullable: true, example: 650 },
            actualCostUserDecision: {
              type: 'string',
              nullable: true,
              enum: ['pending', 'accepted', 'rejected'],
              example: 'pending',
            },
            actualCostAcceptedAt: { type: 'string', format: 'date-time', nullable: true },
            workflowStatus: {
              type: 'string',
              enum: [
                'CREATED', 'AWAITING_ACCEPTANCE', 'DARKWORKSTORE_REJECTED', 'COBBLER_PENDING',
                'COBBLER_REJECTED', 'COBBLER_COST_PENDING', 'COST_APPROVAL_PENDING', 'PAYMENT_PENDING',
                'PAYMENT_SUCCESS', 'PICKUP_SCHEDULED', 'IN_PROGRESS', 'WORK_COMPLETED',
                'DELIVERY_SCHEDULED', 'DELIVERED', 'CLOSED', 'ESCALATED_TO_GMP',
              ],
              example: 'AWAITING_ACCEPTANCE',
            },
            paymentState: {
              type: 'string',
              enum: [
                'PAYMENT_PENDING', 'COST_APPROVAL_PENDING', 'PAYMENT_INITIATED',
                'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'PAYMENT_REFUNDED',
              ],
              example: 'PAYMENT_PENDING',
            },
            activePaymentId: { type: 'string', nullable: true },
            acceptedProviderType: {
              type: 'string',
              nullable: true,
              enum: ['dark_store', 'cobbler', 'gmp'],
            },
            gmpEscalated: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },

        PaymentServiceRequestBody: {
          type: 'object',
          required: ['serviceRequestId'],
          properties: {
            serviceRequestId: {
              type: 'string',
              description: 'Service request MongoDB ObjectId',
              example: '664a1b2c3d4e5f6a7b8c9d99',
            },
          },
        },

        Payment: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '664a1b2c3d4e5f6a7b8c9d01' },
            orderId: { type: 'string', example: 'GMP-c9d99-1730000000000' },
            serviceRequestId: { type: 'string', example: '664a1b2c3d4e5f6a7b8c9d99' },
            userId: { type: 'string', example: '664a1b2c3d4e5f6a7b8c9d10' },
            amount: { type: 'number', example: 1000 },
            currency: { type: 'string', example: 'INR' },
            providerType: { type: 'string', enum: ['dark_store', 'cobbler', 'gmp'], example: 'cobbler' },
            cobblerId: { type: 'string', nullable: true },
            darkStoreId: { type: 'string', nullable: true, example: 'STORE_21' },
            status: {
              type: 'string',
              enum: ['PAYMENT_PENDING', 'PAYMENT_INITIATED', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'PAYMENT_REFUNDED'],
              example: 'PAYMENT_SUCCESS',
            },
            paymentLinkUrl: { type: 'string', format: 'uri', nullable: true },
            zohoPaymentId: { type: 'string', nullable: true },
            zohoOrderId: { type: 'string', nullable: true },
            gmpShare: { type: 'number', example: 200 },
            cobblerShare: { type: 'number', example: 800 },
            commissionPercent: { type: 'number', example: 20 },
            paidAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },

        Settlement: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            paymentId: { type: 'string' },
            serviceRequestId: { type: 'string' },
            beneficiaryType: { type: 'string', enum: ['cobbler', 'dark_store', 'gmp'] },
            beneficiaryId: { type: 'string' },
            amount: { type: 'number', example: 800 },
            status: { type: 'string', enum: ['pending', 'processing', 'completed', 'failed'], example: 'pending' },
            scheduledAt: { type: 'string', format: 'date-time', nullable: true },
            processedAt: { type: 'string', format: 'date-time', nullable: true },
          },
        },

        Refund: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            paymentId: { type: 'string' },
            serviceRequestId: { type: 'string' },
            userId: { type: 'string' },
            amount: { type: 'number', example: 1000 },
            reason: { type: 'string', nullable: true },
            status: { type: 'string', enum: ['requested', 'processing', 'completed', 'failed'], example: 'requested' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },

        RevenueSplit: {
          type: 'object',
          description: 'Commission breakdown for a payable amount',
          properties: {
            totalAmount: { type: 'number', example: 1000 },
            gmpShare: { type: 'number', example: 200 },
            cobblerShare: { type: 'number', example: 800 },
            partnerShare: { type: 'number', example: 800 },
            commissionPercent: { type: 'number', example: 20 },
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
      { name: 'Authentication', description: 'OTP-based authentication — send X-App / X-App-Source' },
      { name: 'User Profile', description: 'User profile management — Profile created by auth; Role: USER' },
      { name: 'User Notifications', description: 'In-app notifications for customer users — Role: USER' },
      { name: 'Geocoding', description: 'Reverse geocoding (lat/lng to address)' },
      { name: 'Articles', description: 'Article / Digital Shoe Passport (Module 3) — Role: USER' },
      { name: 'Service Requests', description: 'Service request lifecycle APIs (Module 4)' },
      { name: 'Payment', description: 'Zoho payments, cost approval, settlements, refunds (Module 5)' },
      { name: 'Cobbler Profile', description: 'Cobbler profile management — Profile created by auth; Role: COBBER' },
      { name: 'Cobbler Home', description: 'Cobbler home dashboard summary — Role: COBBER' },
      { name: 'Delivery Profile', description: 'Delivery partner profile (mobile) — X-App: DELIVERY_APP' },
      { name: 'Delivery Auth', description: 'Delivery member portal login (dashboard JWT)' },
      { name: 'Delivery Jobs', description: 'Delivery member portal pickup/return jobs' },
      { name: 'Retailer Profile', description: 'Retailer / mobile ADMIN profile APIs' },
      { name: 'Admin Profile', description: 'Legacy /api/admin/profile — Role: ADMIN' },
      { name: 'Darkworkstore Auth', description: 'Darkworkstore dashboard login (no X-App)' },
      { name: 'Darkworkstore Dashboard', description: 'Store overview stats' },
      { name: 'Darkworkstore Jobs', description: 'Inbox, pickup/return, workflow, assign cobbler/delivery' },
      { name: 'Darkworkstore Cobblers', description: 'Internal cobbler employees' },
      { name: 'Darkworkstore Payments', description: 'Store payment workflow' },
      { name: 'Master Admin Dashboard', description: 'Masteradmin ops, users, articles, cobblers, delivery' },
      { name: 'Master Admin Payments', description: 'Platform payment workflow' },
      { name: 'Master Admin Database', description: 'MongoDB overview and clear collection/group/all' },
    ],
  },
  apis: [path.join(__dirname, '../docs/*.paths.js')],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
