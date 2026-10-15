# GetMyPair API — Backend Documentation

Module documentation for the **GetMyPair Node/Express API** (`getmypair-api/server`).  
Keep these files in sync with `server/src/app.js` and `server/src/routes/*.routes.js`.

## Five primary app surfaces

| App | API prefix | Swagger |
|-----|------------|---------|
| **User** | `/api/auth`, `/api/user/*`, `/api/articles`, `/api/sell`, `/api/geocode`, `/api/service`, `/api/payment` | `/api-docs/user` |
| **Cobbler** | `/api/auth`, `/api/cobbler/*`, `/api/service`, `/api/payment` | `/api-docs/cobbler` |
| **Retailer** | `/api/retailer` (legacy `/api/admin/profile`) | `/api-docs/retailer` |
| **Repairshops** | `/api/repairshops` (legacy `/api/darkworkstore`) | `/api-docs/repairshops` |
| **Masteradmin** | `/api/masteradmin` (legacy `/api/sys-admin`) | `/api-docs/masteradmin` |

Delivery profile + portal APIs remain at `/api/delivery` (`/api-docs/delivery`) for current mobile/portal usage.

| Module | Topic | Document |
|--------|--------|----------|
| **1** | Authentication, sessions, phone OTP (MSG91) | [MODULE_1_DOCUMENTATION.md](MODULE_1_DOCUMENTATION.md) |
| **2** | Profiles & geocode | [MODULE_2_DOCUMENTATION.md](MODULE_2_DOCUMENTATION.md) |
| **3** | Articles (Digital Shoe Passport) | [MODULE_3_DOCUMENTATION.md](MODULE_3_DOCUMENTATION.md) |
| **4** | Service requests | [MODULE_4_DOCUMENTATION.md](MODULE_4_DOCUMENTATION.md) |
| **5** | Payments (Zoho) | [MODULE_5_PAYMENT.md](MODULE_5_PAYMENT.md) |
| **6** | Sell My Pair listings & admin review | [MODULE_6_SELL_MY_PAIR.md](MODULE_6_SELL_MY_PAIR.md) |
| **Env** | Environment variables | [ENV.md](ENV.md) |
| **AI** | WhatsApp GetMyPair AI | [GETMYPAIR_AI_WHATSAPP.md](GETMYPAIR_AI_WHATSAPP.md) |
| **Admin** | Masteradmin / Repairshops portals | [ADMIN_DASHBOARD.md](ADMIN_DASHBOARD.md) |

## Quick reference

| Resource | Location |
|----------|----------|
| Route mounts | `server/src/app.js` |
| Full endpoint index | [API-CATALOG.md](API-CATALOG.md) |
| OpenAPI / Swagger UI | Hub: `GET /api-docs` · Full: `/api-docs/all` |
| Health | `GET /health`, `GET /api/version` |
| Config | `server/src/config/env.js` · [ENV.md](ENV.md) |

## Base URL

- **Production:** `https://getmypair-api.onrender.com`
- **Local:** `http://localhost:3000` (or your `PORT` from `.env`)

## Auth headers (mobile apps)

| Header | Purpose |
|--------|---------|
| `Authorization` | `Bearer <accessToken>` on protected routes |
| `X-App-Source` | App identifier (`USER_APP`, `COBBER_APP`, …) — required on `complete-profile` for role |
| `X-App` | Alias for `X-App-Source` (Postman / QA) |
| `X-App-Version` | Client version string |
| `X-Active-Profile-Id` | Active family / profile id (user app) |
| `device-info` | Optional on verify-otp (device label on session) |

## Standard JSON response

```json
{
  "success": true,
  "message": "Human-readable message",
  "data": { }
}
```

Errors: `{ "success": false, "message": "...", "statusCode": 400, "errors": [] }` — see `server/src/utils/response.js`.

## Related client docs

- Web (website + dashboards): `client/client`
- Customer mobile app: `getmypair-mobile/gmp`
- Cobblers app: `gmp-cobblers-app` (if present)

---

*OpenAPI path definitions: `server/src/docs/*.paths.js`*
