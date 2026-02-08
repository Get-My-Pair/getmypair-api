# Authentication Module - Detailed Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Authentication Flow](#authentication-flow)
4. [API Endpoints](#api-endpoints)
5. [Request/Response Specifications](#requestresponse-specifications)
6. [Security Features](#security-features)
7. [OTP System](#otp-system)
8. [JWT Token Management](#jwt-token-management)
9. [Role-Based Access Control](#role-based-access-control)
10. [Error Handling](#error-handling)
11. [Rate Limiting](#rate-limiting)
12. [Session Management](#session-management)
13. [Audit Logging](#audit-logging)
14. [Configuration](#configuration)
15. [Testing](#testing)

---

## Overview

The Authentication Module is a comprehensive security system that provides:
- User registration and login
- Email/Phone verification via OTP
- JWT-based authentication with access and refresh tokens
- Role-based access control (RBAC)
- Session management
- Password reset functionality
- Account security features (lockout, rate limiting)
- Comprehensive audit logging

### Technology Stack
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **OTP Generation**: speakeasy
- **Rate Limiting**: express-rate-limit
- **Validation**: express-validator
- **Logging**: Winston

---

## Architecture

### Directory Structure
```
server/src/
├── config/
│   ├── db.js          # Database connection
│   ├── env.js         # Environment configuration
│   └── jwt.js         # JWT utilities
├── models/
│   ├── user.model.js  # User schema
│   ├── role.model.js  # Role schema
│   ├── otp.model.js   # OTP schema
│   ├── session.model.js # Session schema
│   └── auditLog.model.js # Audit log schema
├── services/
│   ├── auth.service.js    # Authentication business logic
│   ├── otp.service.js     # OTP generation and verification
│   └── token.service.js   # Token management
├── controllers/
│   └── auth.controller.js # Request handlers
├── routes/
│   └── auth.routes.js     # Route definitions
├── middleware/
│   ├── auth.middleware.js  # JWT verification
│   ├── role.middleware.js  # Role authorization
│   ├── rateLimit.js        # Rate limiting
│   └── errorHandler.js     # Error handling
├── validations/
│   └── auth.validation.js  # Input validation rules
└── utils/
    ├── response.js     # Response formatting
    ├── validators.js   # Custom validators
    └── logger.js       # Logging utility
```

### Data Flow
```
Client Request
    ↓
Rate Limiter Middleware
    ↓
Validation Middleware
    ↓
Route Handler
    ↓
Controller
    ↓
Service Layer
    ↓
Model/Database
    ↓
Response
```

---

## Authentication Flow

### 1. User Registration Flow

```
┌─────────┐      ┌──────────┐      ┌─────────┐      ┌──────────┐
│ Client  │─────▶│ Register │─────▶│ Send OTP│─────▶│ Verify   │
│         │      │ Endpoint │      │ Service │      │ OTP      │
└─────────┘      └──────────┘      └─────────┘      └──────────┘
                                                           │
                                                           ▼
                                                  ┌──────────────┐
                                                  │ Create User  │
                                                  │ Generate JWT │
                                                  └──────────────┘
```

**Steps:**
1. User submits registration data (email, password, etc.)
2. System validates input
3. System checks if email already exists
4. System generates OTP and sends to email/phone
5. User verifies OTP
6. System creates user account with hashed password
7. System generates JWT tokens
8. System creates session record
9. System logs audit event
10. System returns tokens to client

### 2. User Login Flow

```
┌─────────┐      ┌──────────┐      ┌────────────┐      ┌──────────┐
│ Client  │─────▶│  Login   │─────▶│  Validate  │─────▶│ Generate │
│         │      │ Endpoint │      │ Credentials│      │   JWT    │
└─────────┘      └──────────┘      └────────────┘      └──────────┘
                                                              │
                                                              ▼
                                                     ┌──────────────┐
                                                     │ Create       │
                                                     │ Session      │
                                                     └──────────────┘
```

**Steps:**
1. User submits email and password
2. System validates input format
3. System checks rate limiting
4. System finds user by email
5. System checks if account is locked
6. System verifies password
7. System checks if email is verified
8. System generates access and refresh tokens
9. System creates session record
10. System updates last login timestamp
11. System logs audit event
12. System returns tokens to client

### 3. Token Refresh Flow

```
┌─────────┐      ┌──────────────┐      ┌──────────────┐
│ Client  │─────▶│ Refresh Token│─────▶│ Verify Token │
│         │      │   Endpoint   │      │   & Generate │
└─────────┘      └──────────────┘      └──────────────┘
                                              │
                                              ▼
                                     ┌──────────────┐
                                     │ New Access   │
                                     │ Token        │
                                     └──────────────┘
```

**Steps:**
1. Client sends refresh token
2. System validates refresh token signature
3. System checks token expiration
4. System verifies token in session
5. System generates new access token
6. System updates session
7. System returns new access token

---

## API Endpoints

### 1. Register User

**Endpoint:** `POST /api/auth/register`

**Description:** Register a new user account. Requires OTP verification.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890" // Optional
}
```

**Validation Rules:**
- `email`: Required, valid email format, unique
- `password`: Required, min 6 characters
- `firstName`: Optional, string
- `lastName`: Optional, string
- `phone`: Optional, valid phone format

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Registration successful. Please verify your email.",
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "otpSent": true
  }
}
```

**Error Responses:**
- `400`: Validation error or email already exists
- `429`: Rate limit exceeded
- `500`: Server error

---

### 2. Send OTP

**Endpoint:** `POST /api/auth/send-otp`

**Description:** Send OTP to user's email or phone for verification.

**Request Body:**
```json
{
  "email": "user@example.com",
  "type": "email" // or "phone"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "expiresIn": 600 // seconds
  }
}
```

**Error Responses:**
- `400`: Invalid email/phone or user not found
- `429`: Rate limit exceeded (max 5 OTP requests per hour)
- `500`: Server error

---

### 3. Verify OTP

**Endpoint:** `POST /api/auth/verify-otp`

**Description:** Verify OTP code sent to user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "type": "email" // or "phone"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "verified": true
  }
}
```

**Error Responses:**
- `400`: Invalid OTP or expired
- `404`: OTP not found
- `429`: Rate limit exceeded
- `500`: Server error

---

### 4. Login

**Endpoint:** `POST /api/auth/login`

**Description:** Authenticate user and receive JWT tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "isEmailVerified": true
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 604800 // seconds (7 days)
    }
  }
}
```

**Error Responses:**
- `400`: Validation error
- `401`: Invalid credentials or account locked
- `403`: Email not verified
- `429`: Rate limit exceeded
- `500`: Server error

---

### 5. Refresh Token

**Endpoint:** `POST /api/auth/refresh-token`

**Description:** Get a new access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 604800
  }
}
```

**Error Responses:**
- `400`: Invalid refresh token
- `401`: Token expired or invalid
- `500`: Server error

---

### 6. Logout

**Endpoint:** `POST /api/auth/logout`

**Description:** Logout user and invalidate session.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Error Responses:**
- `401`: Unauthorized
- `500`: Server error

---

### 7. Get Current User

**Endpoint:** `GET /api/auth/me`

**Description:** Get authenticated user's profile.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890",
      "role": {
        "id": "507f1f77bcf86cd799439012",
        "name": "user",
        "permissions": ["read", "write"]
      },
      "isEmailVerified": true,
      "isPhoneVerified": false,
      "isActive": true,
      "lastLogin": "2024-01-15T10:30:00Z",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

**Error Responses:**
- `401`: Unauthorized
- `500`: Server error

---

### 8. Forgot Password

**Endpoint:** `POST /api/auth/forgot-password`

**Description:** Request password reset link/OTP.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset OTP sent to your email"
}
```

**Error Responses:**
- `400`: Invalid email
- `404`: User not found
- `429`: Rate limit exceeded
- `500`: Server error

---

### 9. Reset Password

**Endpoint:** `POST /api/auth/reset-password`

**Description:** Reset password using OTP or reset token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "NewSecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset successful"
}
```

**Error Responses:**
- `400`: Invalid OTP or weak password
- `401`: Invalid or expired token
- `404`: User not found
- `500`: Server error

---

## Request/Response Specifications

### Standard Request Format

All requests should include:
- **Content-Type**: `application/json`
- **Authorization** (for protected routes): `Bearer <token>`

### Standard Response Format

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information",
  "statusCode": 400
}
```

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST (resource created) |
| 400 | Bad Request | Validation error, malformed request |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

---

## Security Features

### 1. Password Security

**Hashing:**
- Passwords are hashed using bcryptjs
- Salt rounds: 10
- Passwords are never stored in plain text
- Passwords are excluded from query results by default

**Password Requirements:**
- Minimum length: 6 characters
- Recommended: Mix of uppercase, lowercase, numbers, special characters

### 2. JWT Token Security

**Access Token:**
- Expiration: 7 days (configurable)
- Algorithm: HS256
- Contains: userId, email, role
- Stored in memory (client-side)

**Refresh Token:**
- Expiration: 30 days (configurable)
- Algorithm: HS256
- Stored in database (session)
- Can be revoked

**Token Storage:**
- Access token: Client memory (not localStorage)
- Refresh token: HttpOnly cookie (recommended) or database

### 3. Account Lockout

**Lockout Mechanism:**
- After 5 failed login attempts, account is locked
- Lock duration: 30 minutes
- Lock is automatically released after duration
- Admin can manually unlock accounts

### 4. Rate Limiting

**Global Rate Limit:**
- Window: 15 minutes
- Max requests: 100 per IP

**Auth-Specific Rate Limits:**
- Login attempts: 5 per 15 minutes per IP
- OTP requests: 5 per hour per email/phone
- Registration: 3 per hour per IP

### 5. CORS Protection

- Configured for specific origins
- Credentials allowed for authenticated requests
- Preflight requests handled

### 6. Security Headers (Helmet.js)

- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security: max-age=31536000

---

## OTP System

### OTP Generation

**Algorithm:** Time-based OTP (TOTP) using speakeasy

**Properties:**
- Length: 6 digits (configurable)
- Expiration: 10 minutes (configurable)
- Format: Numeric only
- One-time use: OTP is invalidated after use

### OTP Storage

**Database Schema:**
```javascript
{
  email: String,
  phone: String,
  otp: String (hashed),
  type: String ('email' | 'phone'),
  expiresAt: Date,
  attempts: Number,
  isUsed: Boolean
}
```

### OTP Verification Process

1. User requests OTP
2. System generates OTP
3. System hashes OTP
4. System stores hashed OTP with expiration
5. System sends OTP via email/SMS
6. User submits OTP
7. System verifies OTP (hashed comparison)
8. System checks expiration
9. System checks attempt limit (max 5 attempts)
10. System marks OTP as used

### OTP Rate Limiting

- Max 5 OTP requests per email/phone per hour
- Max 5 verification attempts per OTP
- OTP expires after 10 minutes

---

## JWT Token Management

### Token Structure

**Access Token Payload:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "role": "user",
  "iat": 1704067200,
  "exp": 1704672000
}
```

**Refresh Token Payload:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "type": "refresh",
  "iat": 1704067200,
  "exp": 1706659200
}
```

### Token Lifecycle

1. **Generation**: Created during login/registration
2. **Validation**: Verified on each protected request
3. **Refresh**: New access token generated using refresh token
4. **Revocation**: Invalidated on logout or security breach
5. **Expiration**: Automatically expired after set duration

### Token Refresh Strategy

**Recommended Flow:**
1. Store refresh token in HttpOnly cookie
2. Store access token in memory
3. On 401 error, attempt token refresh
4. If refresh succeeds, retry original request
5. If refresh fails, redirect to login

---

## Role-Based Access Control

### Roles

**Default Roles:**
1. **user**: Standard user with basic permissions
2. **admin**: Full system access
3. **moderator**: Limited administrative access

### Permissions

**User Permissions:**
- Read own profile
- Update own profile
- Create own content

**Moderator Permissions:**
- All user permissions
- Moderate content
- View user profiles
- Manage reports

**Admin Permissions:**
- All moderator permissions
- Manage users
- Manage roles
- System configuration
- View audit logs

### Role Middleware Usage

```javascript
// Protect route with role requirement
router.get('/admin/users', 
  authMiddleware, 
  roleMiddleware(['admin']), 
  getUsersController
);
```

---

## Error Handling

### Error Types

1. **Validation Errors**: Input validation failures
2. **Authentication Errors**: Invalid credentials, expired tokens
3. **Authorization Errors**: Insufficient permissions
4. **Not Found Errors**: Resource doesn't exist
5. **Rate Limit Errors**: Too many requests
6. **Server Errors**: Internal server issues

### Error Response Format

```json
{
  "success": false,
  "message": "User-friendly error message",
  "error": "Detailed error for debugging",
  "statusCode": 400,
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

### Error Logging

- All errors are logged with Winston
- Includes: timestamp, error message, stack trace, request details
- Log levels: error, warn, info, debug

---

## Rate Limiting

### Implementation

**Library:** express-rate-limit

**Configuration:**
- Window: 15 minutes (configurable)
- Max requests: 100 per IP (configurable)
- Message: "Too many requests, please try again later"

### Rate Limit Headers

Response includes:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Time when limit resets

### Custom Rate Limits

**Login Endpoint:**
- 5 attempts per 15 minutes per IP

**OTP Endpoint:**
- 5 requests per hour per email/phone

**Registration Endpoint:**
- 3 requests per hour per IP

---

## Session Management

### Session Model

```javascript
{
  userId: ObjectId,
  accessToken: String (hashed),
  refreshToken: String (hashed),
  deviceInfo: String,
  ipAddress: String,
  userAgent: String,
  isActive: Boolean,
  lastActivity: Date,
  expiresAt: Date
}
```

### Session Lifecycle

1. **Creation**: On login/registration
2. **Validation**: On each authenticated request
3. **Update**: Update lastActivity timestamp
4. **Expiration**: Automatic cleanup of expired sessions
5. **Revocation**: Manual logout or security breach

### Session Security

- Tokens stored as hashed values
- Device and IP tracking
- Automatic expiration
- Manual revocation capability
- Multiple sessions per user supported

---

## Audit Logging

### Audit Log Model

```javascript
{
  userId: ObjectId,
  action: String, // 'login', 'logout', 'register', etc.
  resource: String, // 'user', 'auth', etc.
  ipAddress: String,
  userAgent: String,
  status: String, // 'success', 'failure'
  details: Object,
  timestamp: Date
}
```

### Logged Events

- User registration
- User login (success/failure)
- User logout
- Password reset
- OTP generation
- OTP verification
- Token refresh
- Account lockout
- Permission denied

### Log Retention

- Logs retained for 90 days (configurable)
- Automatic cleanup of old logs
- Export capability for compliance

---

## Configuration

### Environment Variables

```env
# Server
NODE_ENV=development
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/getmypair

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_REFRESH_EXPIRE=30d

# OTP
OTP_EXPIRE_MINUTES=10
OTP_LENGTH=6

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

### Configuration Files

**env.js**: Centralized configuration management
**jwt.js**: JWT token utilities
**db.js**: Database connection and configuration

---

## Testing

### Test Structure

```
tests/
├── auth.test.js    # Authentication tests
└── otp.test.js     # OTP tests
```

### Test Coverage

**Authentication Tests:**
- User registration
- User login
- Token refresh
- Logout
- Password reset
- Invalid credentials
- Account lockout

**OTP Tests:**
- OTP generation
- OTP verification
- OTP expiration
- OTP rate limiting
- Invalid OTP handling

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm run test:watch
```

### Test Examples

```javascript
describe('POST /api/auth/register', () => {
  it('should register a new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'Test123!',
        firstName: 'Test',
        lastName: 'User'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });
});
```

---

## Best Practices

### Client-Side

1. **Token Storage**: Store access token in memory, not localStorage
2. **Refresh Token**: Use HttpOnly cookies when possible
3. **Token Refresh**: Implement automatic token refresh on 401
4. **Error Handling**: Handle all error responses gracefully
5. **Loading States**: Show loading indicators during auth operations

### Server-Side

1. **Input Validation**: Always validate and sanitize input
2. **Error Messages**: Don't expose sensitive information in errors
3. **Logging**: Log all security-relevant events
4. **Rate Limiting**: Implement appropriate rate limits
5. **Password Policy**: Enforce strong password requirements
6. **Token Expiration**: Use appropriate expiration times
7. **HTTPS**: Always use HTTPS in production
8. **Secrets**: Never commit secrets to version control

---

## Troubleshooting

### Common Issues

**1. "Invalid token" error**
- Check token expiration
- Verify JWT_SECRET matches
- Ensure token is sent in Authorization header

**2. "OTP expired" error**
- OTP expires after 10 minutes
- Request a new OTP

**3. "Rate limit exceeded" error**
- Wait for rate limit window to reset
- Check rate limit configuration

**4. "Account locked" error**
- Account locks after 5 failed login attempts
- Wait 30 minutes or contact admin

**5. "Email not verified" error**
- Complete email verification process
- Check spam folder for OTP email

---

## Support

For issues or questions:
1. Check this documentation
2. Review error logs
3. Check audit logs for authentication events
4. Contact system administrator

---

**Last Updated:** 2024-01-15
**Version:** 1.0.0
