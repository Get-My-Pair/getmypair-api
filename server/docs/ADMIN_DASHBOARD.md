# Masteradmin & Repairshops Dashboard APIs

The HTML admin UI previously served from `server/public/admin` has been **removed**.
Dashboards now live in the React client (`client/client`) on GoDaddy:

| Dashboard | Frontend URL | API base |
|-----------|--------------|----------|
| Repairshops | `https://www.getmypair.com/repairshops/login` | `/api/repairshops` |
| Masteradmin | `https://www.getmypair.com/masteradmin/login` | `/api/masteradmin` |

## Swagger

- Repairshops: `/api-docs/repairshops`
- Masteradmin: `/api-docs/masteradmin` (legacy alias: `/api-docs/admin`)

## Portal login (email OTP)

Repairshops and Masteradmin share the same `AdminMaster` account and require **password + email OTP**:

1. `POST /api/{portal}/auth/login` `{ email, password }` → sends OTP email, returns `challengeToken`
2. `POST /api/{portal}/auth/verify-otp` `{ challengeToken, otp }` → returns `accessToken`
3. `POST /api/{portal}/auth/resend-otp` `{ challengeToken }` → resends OTP

Configure Resend.com for real delivery (recommended):

```env
RESEND_API_KEY=re_xxxxxxxx
RESEND_FROM_EMAIL=GetMyPair <noreply@yourdomain.com>
```

Use `GetMyPair <onboarding@resend.dev>` only while testing (Resend sandbox).  
Verify your domain in the Resend dashboard before sending to real inboxes.

Optional SMTP fallback:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=GetMyPair <noreply@getmypair.com>
```

In non-production (or with `RETURN_OTP_IN_RESPONSE=true`), the OTP is also returned in the API response for local testing.

## Default master account (first DB seed only)

If the `adminmasters` collection is **empty**, the server creates **one** account:

| Field | Default value |
|-------|----------------|
| Email | `ranjith.c96me@gmail.com` |
| Password | `Admin@123` |

Override via environment variables before first seed:

```env
MASTER_ADMIN_EMAIL=your@email.com
MASTER_ADMIN_PASSWORD=YourStrongPassword
ADMIN_JWT_EXPIRE=12h
```

## Canonical API mounts

### Masteradmin — `/api/masteradmin`

Auth, dashboard stats, users, articles, **Sell My Pair listings review**, service requests, cobblers, delivery partners/members/jobs, repairshops users, payments, email templates, DB maintenance.

Legacy alias (same router): `/api/sys-admin`.

### Sell My Pair review (Masteradmin)

| Method | Path | Notes |
|--------|------|--------|
| GET | `/api/masteradmin/sell-listings` | Query: `status`, `footwearType` |
| GET | `/api/masteradmin/sell-listings/:id` | Detail + proofs |
| PATCH | `/api/masteradmin/sell-listings/:id/review` | Body: `{ status: "approved" \| "rejected", rejectReason? }` |

Full request/response: [MODULE_6_SELL_MY_PAIR.md](MODULE_6_SELL_MY_PAIR.md).  
React UI: `client/client` → `/masteradmin/sell-my-pair`.

### Repairshops — `/api/repairshops`

Auth, jobs, cobbler tooling, payments (see `repairshops.routes.js`).  
Legacy alias: `/api/darkworkstore`.

JWT payload: `{ type: 'admin_master', adminMasterId }` — separate from mobile `User` + `Session` auth.

## Note

This is **not** the same as Retailer APIs (`/api/retailer` or legacy `/api/admin/profile/*`), which use the mobile **ADMIN** role and the standard `User` + session JWT.

Phone login for User/Cobbler apps uses MSG91 / dummy OTP — see [MODULE_1_DOCUMENTATION.md](MODULE_1_DOCUMENTATION.md) and [ENV.md](ENV.md).
