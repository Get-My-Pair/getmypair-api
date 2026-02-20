# Authentication Module - Code Structure

## Overview
This document describes the complete folder structure and organization of the Authentication Module for the GetMyPair API.

## Folder Structure

```
server/
├── src/
│   ├── app.js                      # Express app configuration & middleware setup
│   ├── server.js                   # Server entry point & startup
│   │
│   ├── config/                     # Configuration files
│   │   ├── db.js                   # MongoDB connection
│   │   ├── env.js                  # Environment variables
│   │   ├── jwt.js                  # JWT token generation & verification
│   │   └── swagger.js              # Swagger/OpenAPI documentation config
│   │
│   ├── models/                     # Mongoose database models
│   │   ├── user.model.js           # User schema (mobile, name, DOB, gender)
│   │   ├── otp.model.js            # OTP schema (phone, otp, expiresAt)
│   │   ├── session.model.js        # Session schema (tokens, device info)
│   │   └── auditLog.model.js       # Audit log schema (user actions tracking)
│   │
│   ├── services/                   # Business logic layer
│   │   ├── auth.service.js         # Authentication business logic
│   │   │   ├── sendOTP()          # Generate & send OTP
│   │   │   ├── verifyOTP()        # Verify OTP & check user existence
│   │   │   ├── completeProfile()   # Create new user account
│   │   │   └── getCurrentUser()   # Get user profile
│   │   ├── otp.service.js          # OTP generation & verification logic
│   │   │   ├── generateOTP()      # Generate random 6-digit OTP
│   │   │   ├── createOTP()        # Create & store OTP in DB
│   │   │   ├── verifyOTP()        # Verify OTP code
│   │   │   └── checkRateLimit()    # Check OTP rate limiting
│   │   └── token.service.js        # JWT token management
│   │       ├── createSession()     # Create session & generate tokens
│   │       ├── refreshAccessToken() # Refresh access token
│   │       ├── revokeSession()     # Revoke session
│   │       └── revokeAllUserSessions() # Revoke all user sessions
│   │
│   ├── controllers/                # Request handlers (HTTP layer)
│   │   └── auth.controller.js      # Auth endpoint handlers
│   │       ├── sendOTP()          # POST /api/auth/send-otp
│   │       ├── verifyOTP()        # POST /api/auth/verify-otp
│   │       ├── completeProfile()  # POST /api/auth/complete-profile
│   │       ├── refreshToken()     # POST /api/auth/refresh-token
│   │       ├── logout()           # POST /api/auth/logout
│   │       └── getCurrentUser()   # GET /api/auth/me
│   │
│   ├── routes/                     # Route definitions
│   │   └── auth.routes.js         # Auth route definitions with Swagger docs
│   │
│   ├── middleware/                 # Express middleware
│   │   ├── auth.middleware.js     # JWT authentication middleware
│   │   ├── role.middleware.js     # Role-based authorization
│   │   ├── rateLimit.js           # Rate limiting middleware
│   │   └── errorHandler.js        # Global error handler
│   │
│   ├── validations/                # Input validation rules
│   │   └── auth.validation.js      # Express-validator rules
│   │       ├── sendOTPValidation
│   │       ├── verifyOTPValidation
│   │       ├── completeProfileValidation
│   │       └── refreshTokenValidation
│   │
│   ├── utils/                      # Utility functions
│   │   ├── logger.js              # Winston logger configuration
│   │   ├── response.js            # Response formatting helpers
│   │   └── validators.js          # Custom validation functions
│   │
│   └── scripts/                    # Utility scripts
│       └── fix-email-index.js     # Database index fix script
│
├── public/                         # Static files (Frontend UI)
│   ├── index.html                 # Sample HTML frontend
│   └── README.md                  # Frontend documentation
│
├── tests/                          # Test files
│   └── otp.test.js               # OTP service tests
│
├── docs/                          # Documentation
│   └── Auth Module 1/
│       └── AUTH.md               # API documentation
│
├── .env                           # Environment variables (not in git)
├── .env.example                   # Environment variables template
├── package.json                   # Dependencies & scripts
└── README.md                      # Project documentation
```

## Authentication Flow

### 1. Send OTP Flow
```
Client → POST /api/auth/send-otp
  ↓
auth.routes.js (route definition)
  ↓
auth.validation.js (validate mobile number)
  ↓
rateLimit.js (check rate limits)
  ↓
auth.controller.js → sendOTP()
  ↓
auth.service.js → sendOTP()
  ↓
otp.service.js → createOTP()
  ↓
otp.model.js (save to database)
  ↓
Response: OTP sent successfully
```

### 2. Verify OTP Flow
```
Client → POST /api/auth/verify-otp
  ↓
auth.routes.js
  ↓
auth.validation.js (validate mobile & OTP)
  ↓
rateLimit.js
  ↓
auth.controller.js → verifyOTP()
  ↓
auth.service.js → verifyOTP()
  ↓
otp.service.js → verifyOTP()
  ↓
Check if user exists:
  ├─ Yes → token.service.js → createSession()
  │         ↓
  │       Return JWT tokens (Login Success)
  │
  └─ No → Return profile completion flag
```

### 3. Complete Profile Flow
```
Client → POST /api/auth/complete-profile
  ↓
auth.routes.js
  ↓
auth.validation.js (validate name, DOB, gender)
  ↓
auth.controller.js → completeProfile()
  ↓
auth.service.js → completeProfile()
  ↓
user.model.js (create new user)
  ↓
token.service.js → createSession()
  ↓
Response: User created + JWT tokens
```

## File Responsibilities

### Models (`models/`)
- **user.model.js**: User schema with mobile, name, DOB, gender, role
- **otp.model.js**: OTP storage with hashing, expiration, attempts tracking
- **session.model.js**: JWT session management
- **auditLog.model.js**: User action logging

### Services (`services/`)
- **auth.service.js**: Main authentication business logic
- **otp.service.js**: OTP generation, storage, and verification
- **token.service.js**: JWT token creation, refresh, and revocation

### Controllers (`controllers/`)
- **auth.controller.js**: HTTP request/response handling, calls services

### Routes (`routes/`)
- **auth.routes.js**: Route definitions with Swagger documentation

### Middleware (`middleware/`)
- **auth.middleware.js**: JWT token verification
- **role.middleware.js**: Role-based access control
- **rateLimit.js**: Rate limiting configuration
- **errorHandler.js**: Global error handling

### Validations (`validations/`)
- **auth.validation.js**: Input validation rules using express-validator

### Utils (`utils/`)
- **logger.js**: Winston logger setup
- **response.js**: Standardized response formatting
- **validators.js**: Custom validation functions (phone, email)

## Data Flow

```
HTTP Request
    ↓
Rate Limiter
    ↓
Validation Middleware
    ↓
Route Handler
    ↓
Controller
    ↓
Service (Business Logic)
    ↓
Model (Database)
    ↓
Service (Process Results)
    ↓
Controller (Format Response)
    ↓
HTTP Response
```

## Key Features

1. **Mobile OTP Authentication**: No passwords, mobile-first
2. **JWT Tokens**: Access and refresh token pattern
3. **Session Management**: Track active sessions
4. **Audit Logging**: All user actions logged
5. **Rate Limiting**: Protection against abuse
6. **Input Validation**: Comprehensive validation rules
7. **Error Handling**: Centralized error handling

## Best Practices Followed

✅ Separation of concerns (Models, Services, Controllers)
✅ Single Responsibility Principle
✅ DRY (Don't Repeat Yourself)
✅ Consistent error handling
✅ Comprehensive logging
✅ Security best practices (JWT, rate limiting, validation)
✅ API documentation (Swagger)

