# GetMyPair API — Backend Documentation

Module documentation for the **GetMyPair Node/Express API** (`getmypair-api/server`).

## Five primary app surfaces

| App | API prefix | Swagger |
|-----|------------|---------|
| **User** | `/api/auth`, `/api/user/*`, `/api/articles`, `/api/geocode`, `/api/service`, `/api/payment` | `/api-docs/user` |
| **Cobbler** | `/api/auth`, `/api/cobbler/*`, `/api/service`, `/api/payment` | `/api-docs/cobbler` |
| **Retailer** | `/api/retailer` (legacy `/api/admin/profile`) | `/api-docs/retailer` |
| **Darkworkstore** | `/api/darkworkstore` | `/api-docs/darkworkstore` |
| **Masteradmin** | `/api/masteradmin` (legacy `/api/sys-admin`) | `/api-docs/masteradmin` |

Delivery profile APIs remain at `/api/delivery/profile` (`/api-docs/delivery`) for current mobile usage.

| Module | Topic | Document |
|--------|--------|----------|
| **1** | Authentication & health | [MODULE_1_DOCUMENTATION.md](MODULE_1_DOCUMENTATION.md) |
| **2** | Profiles & geocode | [MODULE_2_DOCUMENTATION.md](MODULE_2_DOCUMENTATION.md) |
| **3** | Articles (Digital Shoe Passport) | [MODULE_3_DOCUMENTATION.md](MODULE_3_DOCUMENTATION.md) |
| **4** | Service requests | [MODULE_4_DOCUMENTATION.md](MODULE_4_DOCUMENTATION.md) |
| **5** | Payments (Zoho) | [MODULE_5_PAYMENT.md](MODULE_5_PAYMENT.md) |
| **AI** | WhatsApp GetMyPair AI (`+91 63741 29515`) | [GETMYPAIR_AI_WHATSAPP.md](GETMYPAIR_AI_WHATSAPP.md) |

## Quick reference

| Resource | Location |
|----------|----------|
| Route mounts | `server/src/app.js` |
| Full endpoint index | [API-CATALOG.md](API-CATALOG.md) |
| OpenAPI / Swagger UI | Hub: `GET /api-docs` · see table above · Full: `/api-docs/all` |
| Health | `GET /health`, `GET /api/version` |
| Dashboard APIs | [ADMIN_DASHBOARD.md](ADMIN_DASHBOARD.md) |

## Base URL

- **Production:** `https://getmypair-api.onrender.com`
- **Local:** `http://localhost:3000` (or your `PORT` from `.env`)

## Auth headers (mobile apps)

| Header | Purpose |
|--------|---------|
| `Authorization` | `Bearer <accessToken>` on protected routes |
| `X-App-Source` | App identifier (e.g. `USER_APP`, `COBBER_APP`) — used at `complete-profile` for role |
| `X-App-Version` | Client version string |
| `device-info` | Optional on verify-otp (e.g. `mobile`) |

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
- Customer mobile app: `getmypair-mobile/gmp/docs/`
- Cobblers app: `gmp-cobblers-app/cobbler_app/docs/` (if present)

---

*OpenAPI path definitions: `server/src/docs/*.paths.js`*
