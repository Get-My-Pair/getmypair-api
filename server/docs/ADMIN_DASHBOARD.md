# Master Admin HTML Dashboard

Part of the GetMyPair backend. Customer/cobbler **mobile JWT APIs** are documented in [README.md](README.md) (Modules 1–4). This document covers the **master admin** HTML UI and `/api/sys-admin` APIs only.

## URL

- **Login / entry:** `http://localhost:3000/admin/` (or `/admin` → redirects to `/admin/`)
- **Swagger (Master Admin API):** `http://localhost:3000/api-docs/admin/`

## Default master account (first DB seed only)

If the `adminmasters` collection is **empty**, the server creates **one** account:

| Field    | Default value |
|----------|----------------|
| Email    | `ranjith.c96me@gmail.com` |
| Password | `Admin@123` |

Override via environment variables before first seed:

```env
MASTER_ADMIN_EMAIL=your@email.com
MASTER_ADMIN_PASSWORD=YourStrongPassword
ADMIN_JWT_EXPIRE=12h
```

**Production:** set strong `MASTER_ADMIN_PASSWORD` in `.env` and rotate after deploy. The seed runs only when there are **zero** documents in `AdminMaster`; it does not reset an existing password.

## APIs (`/api/sys-admin`)

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/sys-admin/auth/login` | Body: `{ "email", "password" }` |
| GET | `/api/sys-admin/auth/me` | Bearer master-admin JWT |
| GET | `/api/sys-admin/dashboard/stats` | Bearer |
| GET | `/api/sys-admin/users?page=1&limit=50` | Bearer |
| GET | `/api/sys-admin/articles/by-owner` | Bearer — owners with article counts |
| GET | `/api/sys-admin/articles` | Bearer — optional `?ownerId=` to filter by owner |
| GET | `/api/sys-admin/service-requests` | Bearer — items include `user` + `article` (populated) |
| GET | `/api/sys-admin/service-requests/:id` | Bearer — full detail + resolved pickup `address` from user profile |
| PATCH | `/api/sys-admin/service-requests/:id` | Bearer — workflow + assignments + **`estimatedCost` / `actualCost`** (number or `null`). Same optional fields as before. |
| DELETE | `/api/sys-admin/service-requests/:id` | Bearer — hard delete |
| GET | `/api/sys-admin/cobblers` | Bearer |
| GET | `/api/sys-admin/delivery-partners` | Bearer |

JWT payload: `{ type: 'admin_master', adminMasterId }` — separate from mobile `User` + `Session` auth.

## Static files

Located under `server/public/admin/`:

- `index.html` — login
- `dashboard.html`, `users.html`, `articles.html`, `services.html`, `cobblers.html`, `delivery.html`
- `css/admin.css`, `js/admin-core.js`, page scripts

## Note

This is **not** the same as `/api/admin/profile/*`, which uses the mobile **ADMIN** role and the standard `User` + session JWT.
