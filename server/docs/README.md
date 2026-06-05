# GetMyPair API — Backend Documentation

Module documentation for the **GetMyPair Node/Express API** (`getmypair-api/server`).

| Module | Topic | Document |
|--------|--------|----------|
| **1** | Authentication & health | [MODULE_1_DOCUMENTATION.md](MODULE_1_DOCUMENTATION.md) |
| **2** | Profiles & geocode | [MODULE_2_DOCUMENTATION.md](MODULE_2_DOCUMENTATION.md) |
| **3** | Articles (Digital Shoe Passport) | [MODULE_3_DOCUMENTATION.md](MODULE_3_DOCUMENTATION.md) |
| **4** | Service requests | [MODULE_4_DOCUMENTATION.md](MODULE_4_DOCUMENTATION.md) |

## Quick reference

| Resource | Location |
|----------|----------|
| Route mounts | `server/src/app.js` |
| Full endpoint index (with line numbers) | [API-CATALOG.md](API-CATALOG.md) |
| OpenAPI / Swagger UI | `GET /api-docs` (main), `GET /api-docs/admin` (sys-admin) |
| Health | `GET /health`, `GET /api/version` |
| Master admin HTML UI | [ADMIN_DASHBOARD.md](ADMIN_DASHBOARD.md) — `/admin/`, `/api/sys-admin` |

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

- Customer mobile app: `getmypair-mobile/gmp/docs/`
- Cobblers app: `gmp-cobblers-app/cobbler_app/docs/` (if present)

---

*OpenAPI path definitions: `server/src/docs/*.paths.js`*
