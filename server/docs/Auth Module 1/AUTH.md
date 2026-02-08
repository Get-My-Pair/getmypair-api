# Authentication Module - Quick Reference

## Overview
The authentication module provides secure user authentication using JWT tokens, OTP verification, and role-based access control.

## Key Features
- **JWT Authentication** - Access and refresh tokens
- **OTP Verification** - Email/Phone verification via OTP
- **Role-Based Access Control** - User, Admin, Moderator roles
- **Rate Limiting** - Protection against brute force attacks
- **Session Management** - Secure session tracking
- **Audit Logging** - Track authentication events

## Authentication Flow

### 1. Registration
```
POST /api/auth/register
→ Generate OTP
→ Verify OTP
→ Create account
```

### 2. Login
```
POST /api/auth/login
→ Validate credentials
→ Generate JWT tokens
→ Create session
```

### 3. OTP Verification
```
POST /api/auth/send-otp
POST /api/auth/verify-otp
```

### 4. Token Refresh
```
POST /api/auth/refresh-token
→ Validate refresh token
→ Generate new access token
```

## Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | User login | No |
| POST | `/api/auth/logout` | User logout | Yes |
| POST | `/api/auth/send-otp` | Send OTP to email/phone | No |
| POST | `/api/auth/verify-otp` | Verify OTP | No |
| POST | `/api/auth/refresh-token` | Refresh access token | No |
| POST | `/api/auth/forgot-password` | Request password reset | No |
| POST | `/api/auth/reset-password` | Reset password with token | No |
| GET | `/api/auth/me` | Get current user | Yes |

## Request Examples

### Register
```json
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

### Login
```json
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

### Send OTP
```json
POST /api/auth/send-otp
{
  "email": "user@example.com",
  "type": "email"
}
```

## Response Format

### Success
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error
```json
{
  "success": false,
  "message": "Error message",
  "error": "Error details"
}
```

## Security Features
- Password hashing with bcrypt
- JWT token expiration
- Rate limiting (100 requests per 15 minutes)
- Account lockout after failed attempts
- Secure session management
- CORS protection
- Helmet.js security headers

## Environment Variables
```env
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
OTP_EXPIRE_MINUTES=10
RATE_LIMIT_MAX_REQUESTS=100
```

## Error Codes
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error
