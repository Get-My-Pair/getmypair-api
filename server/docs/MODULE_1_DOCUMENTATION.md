# Module 1 — Authentication & Health APIs

## Overview

Module 1 covers **authentication** (mobile OTP, JWT, sessions), **device sessions**, **preferred language**, and **health/version**. Mobile login is OTP-based (no passwords). Portal dashboards use a separate email OTP flow — see [ADMIN_DASHBOARD.md](ADMIN_DASHBOARD.md).

| Layer | File |
|-------|------|
| Routes | `server/src/routes/auth.routes.js` |
| Controller | `server/src/controllers/auth.controller.js`, `session.controller.js` |
| Service | `auth.service.js`, `otp.service.js`, `msg91.service.js`, `token.service.js` |
| Config | `server/src/config/env.js` · [ENV.md](ENV.md) |

---

## All APIs (Module 1)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/health` | Server health + version | No |
| GET | `/api/version` | Get API version (for app/update checks) | No |
| POST | `/api/auth/send-otp` | Create OTP; SMS via MSG91 or return OTP (dummy) | No |
| POST | `/api/auth/verify-otp` | Verify OTP and check if user exists | No |
| POST | `/api/auth/complete-profile` | Complete profile for new users | No (`X-App-Source` required) |
| POST | `/api/auth/refresh-token` | Refresh access token | No |
| POST | `/api/auth/logout` | User logout | Yes (Bearer JWT) |
| GET | `/api/auth/me` | Get current user | Yes |
| GET | `/api/auth/sessions` | List active sessions (devices) | Yes |
| DELETE | `/api/auth/sessions/:sessionId` | Revoke a session | Yes |
| GET | `/api/auth/languages` | Supported Cobbler languages | No |
| PUT | `/api/auth/language` | Update preferred language | Yes |

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

Creates a phone OTP (stored hashed), then either:

1. **SMS mode** — `USE_MSG91_SMS=true` (default when `NODE_ENV=production`): sends the code via MSG91 (`msg91.service.js`). Response does **not** include the OTP.
2. **Dummy mode** — `USE_MSG91_SMS=false` (default in development): skips SMS and returns `data.otp` so the mobile app can show the development popup.

Mobile is normalized (`+91` if missing). Rate-limited (`otpSendRateLimiter`). Blocks if the number is already registered under a different app role (`X-App-Source`).

**Request:**
```json
{
  "mobile": "+919876543210"
}
```

**Headers (recommended):** `X-App-Source: USER_APP` (or `COBBER_APP`).

**Validation:** `mobile` required, at least 10 digits, valid phone format.

**Response — SMS mode (200):**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "expiresIn": 300
  }
}
```

**Response — dummy mode (200):**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "expiresIn": 300,
    "otp": "123456"
  }
}
```

**Env:** see [ENV.md](ENV.md) — `USE_MSG91_SMS`, `MSG91_AUTH_KEY`, `MSG91_TEMPLATE_ID`, `OTP_EXPIRE_MINUTES`.

**Errors:** `503` if SMS mode is on but MSG91 is not configured; `429` rate limit; `400` role conflict / validation; `502` MSG91 delivery failure.

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
      "isActive": true
    }
  }
}
```

---

## 9. Manage devices (sessions)

**GET** `/api/auth/sessions` — list active sessions for the user.  
**DELETE** `/api/auth/sessions/:sessionId` — revoke one session.

Both require `Authorization: Bearer <accessToken>`. Implemented in `session.controller.js`.

---

## 10. Languages (Cobbler)

**GET** `/api/auth/languages` — public list of supported language codes.  
**PUT** `/api/auth/language` — update preferred language (auth required). Body: `{ "preferredLanguage": "en" }` (or supported code).

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

- OTP hashed, expiry default **5 minutes**, max verify attempts **3** (`OTP_*` env)
- JWT access default `5m`, refresh `7d` (override via env)
- Rate limiting on send/verify OTP and global API limiter
- CORS, Helmet, audit logging
- Phone SMS: MSG91 when `USE_MSG91_SMS=true` (requires DLT-ready template in India)

Full env list: [ENV.md](ENV.md).

```env
JWT_SECRET=your-secret-key
JWT_EXPIRE=5m
JWT_REFRESH_EXPIRE=7d
OTP_EXPIRE_MINUTES=5
OTP_LENGTH=6
USE_MSG91_SMS=false
# USE_MSG91_SMS=true
# MSG91_AUTH_KEY=...
# MSG91_TEMPLATE_ID=...
```

---

## Backend Files (Module 1)

| Layer | File |
|-------|------|
| Routes | `server/src/routes/auth.routes.js` |
| Controller | `server/src/controllers/auth.controller.js`, `session.controller.js` |
| Service | `auth.service.js`, `otp.service.js`, `msg91.service.js`, `token.service.js` |
| Validation | `server/src/validations/auth.validation.js` |
| Models | `user.model.js`, `otp.model.js`, `session.model.js` |
| Middleware | `auth.middleware.js`, `rateLimit.js`, `appSource.middleware.js` |
| App mount | `server/src/app.js` — `/api/auth`, `/api/version`, `/health` |

## Related modules

- **Module 2:** Profile rows created via `complete-profile` → `/api/user/profile`, `/api/cobbler/profile`, etc.
- **Module 3–6:** Require `Authorization: Bearer <accessToken>` from this module.
- **Admin portals:** [ADMIN_DASHBOARD.md](ADMIN_DASHBOARD.md) (email OTP, not phone MSG91).

See also: [README.md](README.md), [API-CATALOG.md](API-CATALOG.md), [ENV.md](ENV.md).
