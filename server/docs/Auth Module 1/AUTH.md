# Authentication Module - Quick Reference

## Overview
The authentication module provides secure mobile OTP-based user authentication using JWT tokens and role-based access control.

## Key Features
- **Mobile OTP Authentication** - No passwords required
- **JWT Authentication** - Access and refresh tokens
- **OTP Verification** - Mobile number verification via OTP
- **Role-Based Access Control** - User, Admin, Moderator roles
- **Rate Limiting** - Protection against brute force attacks
- **Session Management** - Secure session tracking
- **Audit Logging** - Track authentication events

## Authentication Flow

### 1. Send OTP
```
POST /api/auth/send-otp
→ Enter mobile number
→ Generate random OTP
→ Store OTP in database (hashed)
```

### 2. Verify OTP
```
POST /api/auth/verify-otp
→ Verify OTP code
→ Check if user exists in database
  ├─ Yes: Existing User → Login Success (Generate JWT)
  └─ No: New User → Ask for Name, DOB, Gender
```

### 3. Complete Profile (New Users Only)
```
POST /api/auth/complete-profile
→ Provide: name, dateOfBirth, gender
→ Create user account
→ Login Success (Generate JWT)
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
| POST | `/api/auth/send-otp` | Send OTP to mobile number | No |
| POST | `/api/auth/verify-otp` | Verify OTP and check user | No |
| POST | `/api/auth/complete-profile` | Complete profile for new users | No |
| POST | `/api/auth/refresh-token` | Refresh access token | No |
| POST | `/api/auth/logout` | User logout | Yes |
| GET | `/api/auth/me` | Get current user | Yes |

## Request Examples

### Send OTP
```json
POST /api/auth/send-otp
{
  "mobile": "+1234567890"
}
```

### Verify OTP (Existing User Response)
```json
POST /api/auth/verify-otp
{
  "mobile": "+1234567890",
  "otp": "123456"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "tokens": {
      "accessToken": "...",
      "refreshToken": "...",
      "expiresIn": "7d"
    }
  }
}
```

### Verify OTP (New User Response)
```json
POST /api/auth/verify-otp
{
  "mobile": "+1234567890",
  "otp": "123456"
}

Response:
{
  "success": true,
  "message": "Please complete your profile",
  "data": {
    "requiresProfileCompletion": true,
    "mobile": "+1234567890"
  }
}
```

### Complete Profile
```json
POST /api/auth/complete-profile
{
  "mobile": "+1234567890",
  "name": "John Doe",
  "dateOfBirth": "1990-01-01",
  "gender": "male"
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
  "errors": [
    {
      "field": "mobile",
      "message": "Mobile number is required"
    }
  ]
}
```

## Security Features
- OTP hashing with bcrypt
- JWT token expiration
- Rate limiting (5 OTP requests per hour)
- Secure session management
- CORS protection
- Helmet.js security headers
- OTP expiration (10 minutes default)
- Maximum OTP verification attempts (5 attempts)

## Environment Variables
```env
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d
OTP_EXPIRE_MINUTES=10
OTP_LENGTH=6
RATE_LIMIT_MAX_REQUESTS=100
```

## Error Codes
- `400` - Bad Request (validation errors, invalid OTP)
- `401` - Unauthorized (invalid token)
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error
