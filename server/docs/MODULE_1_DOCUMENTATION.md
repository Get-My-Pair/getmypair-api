# Module 1 — Authentication & Health APIs

## Overview

Module 1 covers **authentication** (mobile OTP, JWT, sessions) and **health/version**. All auth is mobile OTP–based with no passwords.

---

## All APIs (Module 1)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/version` | Get API version (for app/update checks) | No |
| POST | `/api/auth/send-otp` | Send OTP to mobile number | No |
| POST | `/api/auth/verify-otp` | Verify OTP and check if user exists | No |
| POST | `/api/auth/complete-profile` | Complete profile for new users | No |
| POST | `/api/auth/refresh-token` | Refresh access token | No |
| POST | `/api/auth/logout` | User logout | Yes (Bearer JWT) |
| GET | `/api/auth/me` | Get current user | Yes (Bearer JWT) |

---

## 1. Get API Version

**GET** `/api/version`

Returns current API version and name. No authentication.

**Response (200):**
```json
{
  "success": true,
  "version": "1.0.0",
  "name": "getmypair-api"
}
```

---

## 2. Send OTP

**POST** `/api/auth/send-otp`

Send OTP to the given mobile number. OTP is stored (hashed) and rate-limited.

**Request:**
```json
{
  "mobile": "+1234567890"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {}
}
```

**Notes:** Rate limited (e.g. 5 OTP requests per hour in prod). OTP expires in 10 minutes (configurable).

---

## 3. Verify OTP

**POST** `/api/auth/verify-otp`

Verify OTP. If user exists → login (returns JWT). If new user → returns flag to complete profile.

**Request:**
```json
{
  "mobile": "+1234567890",
  "otp": "123456"
}
```

**Response — Existing user (login success):**
```json
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

**Response — New user (profile completion required):**
```json
{
  "success": true,
  "message": "Please complete your profile",
  "data": {
    "requiresProfileCompletion": true,
    "mobile": "+1234567890"
  }
}
```

---

## 4. Complete Profile (New Users Only)

**POST** `/api/auth/complete-profile`

Create account for new user after OTP verification. Returns JWT on success.

**Request:**
```json
{
  "mobile": "+1234567890",
  "name": "John Doe",
  "dateOfBirth": "1990-01-01",
  "gender": "male"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Profile completed successfully",
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

---

## 5. Refresh Token

**POST** `/api/auth/refresh-token`

Get a new access token using a valid refresh token.

**Request:**
```json
{
  "refreshToken": "..."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "...",
    "expiresIn": "7d"
  }
}
```

---

## 6. Logout

**POST** `/api/auth/logout`

Invalidate current session. Requires valid JWT.

**Headers:** `Authorization: Bearer <accessToken>`

**Request (optional):**
```json
{
  "refreshToken": "..."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 7. Get Current User

**GET** `/api/auth/me`

Return the authenticated user. Requires valid JWT.

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "user": {
      "_id": "...",
      "mobile": "+1234567890",
      "name": "John Doe",
      "dateOfBirth": "1990-01-01",
      "gender": "male",
      "role": "USER",
      "isPhoneVerified": true,
      "isActive": true,
      ...
    }
  }
}
```

---

## Standard Response Format

**Success:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    { "field": "mobile", "message": "Mobile number is required" }
  ]
}
```

---

## Error Codes

| Code | Meaning |
|------|--------|
| 400 | Bad Request (validation, invalid OTP) |
| 401 | Unauthorized (invalid/missing token) |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Too Many Requests (rate limit) |
| 500 | Internal Server Error |

---

## Security & Config

- OTP hashed (bcrypt), expiry (e.g. 10 min), max attempts (e.g. 5)
- JWT: access (e.g. 7d), refresh (e.g. 30d)
- Rate limiting on OTP and global
- CORS, Helmet, audit logging

**Environment variables (examples):**
```env
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d
OTP_EXPIRE_MINUTES=10
OTP_LENGTH=6
RATE_LIMIT_MAX_REQUESTS=100
```
