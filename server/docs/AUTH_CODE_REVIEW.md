# Authentication Module - Code Review & Structure

## Current Folder Structure ✅

```
server/src/
├── config/              ✅ Configuration files
│   ├── db.js           ✅ MongoDB connection
│   ├── env.js          ✅ Environment variables
│   ├── jwt.js          ✅ JWT utilities
│   └── swagger.js      ✅ API documentation config
│
├── models/              ✅ Database models
│   ├── user.model.js   ✅ User schema (mobile-first)
│   ├── otp.model.js    ✅ OTP schema
│   ├── session.model.js ✅ Session schema
│   └── auditLog.model.js ✅ Audit log schema
│
├── services/            ✅ Business logic
│   ├── auth.service.js  ✅ Auth business logic
│   ├── otp.service.js   ✅ OTP management
│   └── token.service.js ✅ Token management
│
├── controllers/         ✅ HTTP handlers
│   └── auth.controller.js ✅ Auth endpoints
│
├── routes/              ✅ Route definitions
│   └── auth.routes.js  ✅ Auth routes with Swagger
│
├── middleware/          ✅ Express middleware
│   ├── auth.middleware.js ✅ JWT authentication
│   ├── role.middleware.js ✅ Role authorization
│   ├── rateLimit.js     ✅ Rate limiting
│   └── errorHandler.js  ✅ Error handling
│
├── validations/          ✅ Input validation
│   └── auth.validation.js ✅ Validation rules
│
├── utils/               ✅ Utilities
│   ├── logger.js        ✅ Winston logger
│   ├── response.js      ✅ Response helpers
│   └── validators.js    ✅ Custom validators
│
└── scripts/              ✅ Utility scripts
    └── fix-email-index.js ✅ DB index fix
```

## Authentication Module Components

### 1. Models (Database Schema)

#### `user.model.js`
- **Fields**: mobile (unique), name, dateOfBirth, gender, email (optional), role, isPhoneVerified, isActive, lastLogin
- **Indexes**: mobile (unique), role, email (sparse unique)
- **Purpose**: User data storage

#### `otp.model.js`
- **Fields**: phone, otp (hashed), type, purpose, expiresAt, attempts, isUsed
- **Indexes**: phone+type, expiresAt (TTL)
- **Purpose**: OTP storage and verification

#### `session.model.js`
- **Fields**: userId, accessToken (hashed), refreshToken (hashed), deviceInfo, ipAddress, userAgent, expiresAt, isActive
- **Purpose**: Session management

#### `auditLog.model.js`
- **Fields**: userId, action, resource, status, ipAddress, userAgent, details, errorMessage, timestamp
- **Indexes**: userId+timestamp, action+timestamp, status+timestamp, timestamp (TTL 90 days)
- **Purpose**: Audit trail for all user actions

### 2. Services (Business Logic)

#### `auth.service.js`
**Functions:**
- `sendOTP(mobile, ipAddress, userAgent)` - Generate and send OTP
- `verifyOTP(mobile, otp, ipAddress, userAgent, deviceInfo)` - Verify OTP and check user existence
- `completeProfile(mobile, name, dateOfBirth, gender, ...)` - Create new user account
- `getCurrentUser(userId, ipAddress, userAgent)` - Get user profile

**Features:**
- Mobile number normalization (+91 prefix)
- User existence checking
- Audit logging
- Error handling

#### `otp.service.js`
**Functions:**
- `generateOTP()` - Generate random 6-digit OTP
- `createOTP(email, phone, type, purpose)` - Create and store OTP
- `verifyOTP(email, phone, otpCode, type)` - Verify OTP code
- `checkRateLimit(email, phone, type)` - Check rate limiting

**Features:**
- OTP hashing (bcrypt)
- Expiration handling
- Attempt tracking
- Rate limiting

#### `token.service.js`
**Functions:**
- `createSession(user, deviceInfo, ipAddress, userAgent)` - Create session and tokens
- `refreshAccessToken(refreshToken)` - Refresh access token
- `revokeSession(refreshToken)` - Revoke session
- `revokeAllUserSessions(userId)` - Revoke all user sessions

**Features:**
- JWT token generation
- Session management
- Token refresh

### 3. Controllers (HTTP Layer)

#### `auth.controller.js`
**Endpoints:**
- `POST /api/auth/send-otp` → `sendOTP()`
- `POST /api/auth/verify-otp` → `verifyOTP()`
- `POST /api/auth/complete-profile` → `completeProfile()`
- `POST /api/auth/refresh-token` → `refreshToken()`
- `POST /api/auth/logout` → `logout()`
- `GET /api/auth/me` → `getCurrentUser()`

**Responsibilities:**
- Extract request data
- Call service layer
- Format responses
- Handle errors
- Log audit events

### 4. Routes (API Definitions)

#### `auth.routes.js`
- Route definitions with Swagger documentation
- Middleware application (validation, rate limiting, auth)
- Route organization

### 5. Middleware

#### `auth.middleware.js`
- JWT token verification
- User authentication
- Session validation
- Audit logging for auth failures

#### `role.middleware.js`
- Role-based authorization
- Permission checking

#### `rateLimit.js`
- Global rate limiting
- OTP-specific rate limiting (20/15min in dev, 5/hour in prod)

#### `errorHandler.js`
- Global error handling
- Error formatting
- Logging

### 6. Validations

#### `auth.validation.js`
- `sendOTPValidation` - Mobile number validation
- `verifyOTPValidation` - Mobile + OTP validation
- `completeProfileValidation` - Name, DOB, gender validation
- `refreshTokenValidation` - Refresh token validation

### 7. Utils

#### `logger.js`
- Winston logger configuration
- Log levels and formatting

#### `response.js`
- Standardized response formatting
- Success/error response helpers

#### `validators.js`
- Custom validation functions
- Phone number validation
- Email validation

## Code Quality Checklist

✅ **Separation of Concerns**
- Models: Data structure only
- Services: Business logic
- Controllers: HTTP handling
- Routes: Route definitions

✅ **Error Handling**
- Try-catch blocks in all async functions
- Centralized error handler
- Proper error logging

✅ **Security**
- JWT token authentication
- OTP hashing
- Rate limiting
- Input validation
- Audit logging

✅ **Code Organization**
- Clear folder structure
- Consistent naming conventions
- Proper module exports
- Documentation comments

✅ **Best Practices**
- Async/await pattern
- Error propagation
- Logging
- Validation

## API Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/send-otp` | No | Send OTP to mobile |
| POST | `/api/auth/verify-otp` | No | Verify OTP & check user |
| POST | `/api/auth/complete-profile` | No | Create user account |
| POST | `/api/auth/refresh-token` | No | Refresh access token |
| POST | `/api/auth/logout` | Yes | Logout user |
| GET | `/api/auth/me` | Yes | Get current user |

## Data Flow

```
Request → Rate Limiter → Validation → Controller → Service → Model → Database
                                                              ↓
Response ← Controller ← Service ← Model ← Database
```

## Security Features

1. **OTP Security**
   - Hashed storage (bcrypt)
   - Expiration (10 minutes)
   - Attempt limits (5 attempts)
   - Rate limiting

2. **JWT Security**
   - Access token (7 days)
   - Refresh token (30 days)
   - Session tracking
   - Token revocation

3. **Rate Limiting**
   - Global: 100 requests/15 minutes
   - OTP: 20 requests/15 minutes (dev), 5/hour (prod)

4. **Audit Logging**
   - All actions logged
   - IP address tracking
   - User agent tracking
   - 90-day retention

## Mobile Number Normalization

All mobile numbers are normalized to include country code:
- Input: `6374129515` → Normalized: `+916374129515`
- Ensures consistency across OTP send/verify/profile creation

## Status: ✅ All Code Properly Organized

The authentication module follows best practices with:
- Clear separation of concerns
- Proper folder structure
- Comprehensive error handling
- Security best practices
- Complete audit logging
- Well-documented code

