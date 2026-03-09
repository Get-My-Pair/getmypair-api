# Module 1 — Authentication & Health APIs

## Overview

Module 1 covers **authentication** (mobile OTP, JWT, sessions) and **health/version**. All auth is mobile OTP–based with no passwords. Implemented in `server/src/routes/auth.routes.js`, `server/src/controllers/auth.controller.js`, `server/src/services/auth.service.js`, and validated via `server/src/validations/auth.validation.js`.

---

## All APIs (Module 1)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/health` | Server health + version | No |
| GET | `/api/version` | Get API version (for app/update checks) | No |
| POST | `/api/auth/send-otp` | Send OTP to mobile number | No |
| POST | `/api/auth/verify-otp` | Verify OTP and check if user exists | No |
| POST | `/api/auth/complete-profile` | Complete profile for new users | No |
| POST | `/api/auth/refresh-token` | Refresh access token | No |
| POST | `/api/auth/logout` | User logout | Yes (Bearer JWT) |
| GET | `/api/auth/me` | Get current user | Yes (Bearer JWT) |

---

## 1. Health Check

**GET** `/health`

Returns server health and version. No authentication.

**Response (200):**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2025-03-09T12:00:00.000Z",
  "version": "1.0.0"
}
```

---

## 2. Get API Version

**GET** `/api/version`

Returns current API version and package name. No authentication.

**Response (200):**
```json
{
  "success": true,
  "version": "1.0.0",
  "name": "getmypair-api"
}
```

---

## 3. Send OTP

**POST** `/api/auth/send-otp`

Send OTP to the given mobile number. OTP is stored (hashed) and rate-limited. Mobile is normalized (e.g. `+91` prefix for India if not provided).

**Request:**
```json
{
  "mobile": "+919876543210"
}
```

**Validation:** `mobile` required, at least 10 digits, valid phone format.

**Response (200):**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "expiresIn": 600
  }
}
```

**Development only:** In `NODE_ENV=development`, `data` may include `otp` for testing.

**Notes:** Rate limited via `otpRateLimiter`. OTP expiry and max attempts configured in env (e.g. 10 min). Failed attempts are audit-logged.

---

## 4. Verify OTP

**POST** `/api/auth/verify-otp`

Verify OTP. If user exists → login (returns user + JWT tokens). If new user → returns flag to complete profile. Optional header `device-info` (e.g. `mobile`).

**Request:**
```json
{
  "mobile": "+919876543210",
  "otp": "123456"
}
```

**Validation:** `mobile` required (min 10 digits); `otp` required, 6 digits, numeric.

**Response — Existing user (login success):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { "_id": "...", "mobile": "+919876543210", "name": "John", "dateOfBirth": "1990-01-01", "gender": "male", "role": "user", "isPhoneVerified": true, "isActive": true, ... },
    "tokens": {
      "accessToken": "eyJ...",
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
    "mobile": "+919876543210"
  }
}
```

---

## 5. Complete Profile (New Users Only)

**POST** `/api/auth/complete-profile`

Create account for new user after OTP verification. Returns user + JWT on success. Role is derived from `X-App-Source` (e.g. `USER_APP` → user, `COBBER_APP` → user/cobbler per backend config).

**Headers (optional):**
- `X-App-Source`: e.g. `USER_APP`, `COBBER_APP`
- `X-App-Version`: app version string
- `device-info`: e.g. `mobile`

**Request:**
```json
{
  "mobile": "+919876543210",
  "name": "John Doe",
  "dateOfBirth": "1990-01-01",
  "gender": "male",
  "location": {
    "lat": 13.0827,
    "lng": 80.2707,
    "address": "Chennai, Tamil Nadu"
  }
}
```

**Validation:** `mobile` (required, min 10 digits), `name` (required, 2–100 chars, letters only), `dateOfBirth` (required, YYYY-MM-DD, 18+ years), `gender` (required: `male` | `female` | `other`). `location` optional object; `location.lat`/`lng`/`address` optional.

**Response (201):**
```json
{
  "success": true,
  "message": "Profile completed successfully. Login successful.",
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

## 6. Refresh Token

**POST** `/api/auth/refresh-token`

Get a new access token using a valid refresh token. Session is validated and audit-logged.

**Request:**
```json
{
  "refreshToken": "..."
}
```

**Validation:** `refreshToken` required.

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

## 7. Logout

**POST** `/api/auth/logout`

Invalidate session. Requires valid JWT. If `refreshToken` is sent in body, that session is revoked.

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
  "message": "Logout successful"
}
```

---

## 8. Get Current User

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
      "mobile": "+919876543210",
      "name": "John Doe",
      "dateOfBirth": "1990-01-01",
      "gender": "male",
      "role": "user",
      "isPhoneVerified": true,
      "isActive": true,
      ...
    }
  }
}
```

---

## Standard Response Format

**Success:** `server/src/utils/response.js` — `success(res, message, data, statusCode)`

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error:** `error(res, message, statusCode, error, errors)`

```json
{
  "success": false,
  "message": "Error message",
  "statusCode": 400,
  "errors": []
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

---

## Backend Files (Module 1)

| Layer | File |
|-------|------|
| Routes | `server/src/routes/auth.routes.js` |
| Controller | `server/src/controllers/auth.controller.js` |
| Service | `server/src/services/auth.service.js` |
| Validation | `server/src/validations/auth.validation.js` |
| Middleware | `server/src/middleware/auth.middleware.js`, `server/src/middleware/rateLimit.js` |
| App mount | `server/src/app.js` — `/api/auth`, `/api/version`, `/health` |
