# Environment variables

Source of truth: `server/src/config/env.js` (loaded via `dotenv`).

Set secrets on the host (Render / local `.env`). Prefer env vars over code defaults.

## Core

| Variable | Default | Notes |
|----------|---------|--------|
| `NODE_ENV` | `development` | `production` enforces required secrets |
| `PORT` | `3000` | HTTP port |
| `MONGODB_URI` | *(required in production)* | MongoDB connection string |
| `JWT_SECRET` | *(required in production)* | Access token signing |
| `JWT_EXPIRE` | `5m` | Access token lifetime |
| `JWT_REFRESH_SECRET` | *(required in production)* | Refresh token signing |
| `JWT_REFRESH_EXPIRE` | `7d` | Refresh token lifetime |
| `CORS_ORIGIN` | `*` | `*` reflects request origin; or comma-separated allowlist |
| `LOG_LEVEL` | `info` | Winston level |

## Phone OTP (User / Cobbler mobile login)

| Variable | Default | Notes |
|----------|---------|--------|
| `OTP_EXPIRE_MINUTES` | `5` | OTP lifetime |
| `OTP_LENGTH` | `6` | Digits |
| `OTP_MAX_ATTEMPTS` | `3` | Verify attempts per OTP |
| `USE_MSG91_SMS` | `false` | `true` / `1` → send SMS via MSG91; omit OTP from response. `false` → dummy mode: return `data.otp` for the app popup (use until DLT is ready) |
| `MSG91_AUTH_KEY` | *(empty unless set)* | MSG91 dashboard Authkey |
| `MSG91_TEMPLATE_ID` | *(empty unless set)* | MSG91 OTP template id; template must include `##OTP##` |
| `RETURN_OTP_IN_RESPONSE` | `false` | Portal / email OTP testing; phone login uses `USE_MSG91_SMS` instead |

### Phone OTP behaviour

1. `POST /api/auth/send-otp` always creates a server-side OTP (`otp.service`).
2. If `USE_MSG91_SMS=true` → `msg91.service` sends SMS; response is `{ expiresIn }` only.
3. If `USE_MSG91_SMS=false` → SMS skipped; response includes `{ expiresIn, otp }` for development login.
4. Verify always uses the stored OTP (`POST /api/auth/verify-otp`), never MSG91 verify.

India DLT: MSG91 template must have an approved DLT Template ID + sender ID, or SMS stays Pending.

## Portal email OTP (Masteradmin / Repairshops)

| Variable | Default | Notes |
|----------|---------|--------|
| `RESEND_API_KEY` | | Preferred email delivery |
| `RESEND_FROM_EMAIL` | `GetMyPair <onboarding@resend.dev>` | Verified sender |
| `RESEND_SANDBOX_OWNER_EMAIL` | | Sandbox deliverability |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | | Fallback SMTP |
| `MASTER_ADMIN_EMAIL` / `MASTER_ADMIN_PASSWORD` | | First-seed master account |
| `ADMIN_JWT_EXPIRE` | `12h` | Portal JWT lifetime |

## Cloudinary

| Variable | Notes |
|----------|--------|
| `CLOUDINARY_CLOUD_NAME` | Required for image uploads |
| `CLOUDINARY_API_KEY` | |
| `CLOUDINARY_API_SECRET` | |

## Zoho Payments

See [MODULE_5_PAYMENT.md](MODULE_5_PAYMENT.md) and [ZOHO_OAUTH_SETUP.md](ZOHO_OAUTH_SETUP.md).

| Variable | Notes |
|----------|--------|
| `ZOHO_CLIENT_ID` / `ZOHO_CLIENT_SECRET` / `ZOHO_REFRESH_TOKEN` | OAuth |
| `ZOHO_ACCOUNT_ID` | Payments account |
| `ZOHO_PAYMENTS_BASE_URL` | Default India production URL |
| `ZOHO_WEBHOOK_SECRET` / `ZOHO_SIGNING_KEY` | Webhooks / return URL |
| `ZOHO_PAYMENTS_MOCK` | `true` for local mock |
| Sandbox variants | `ZOHO_SANDBOX_*` |

## Other

| Variable | Notes |
|----------|--------|
| `CLIENT_WEB_URL` | Public site origin (credential emails) |
| `API_PUBLIC_BASE_URL` | Public API base (callbacks) |
| `SETTLEMENT_SCHEDULER_ENABLED` | Default on |
| `SETTLEMENT_SCHEDULER_INTERVAL_MS` | Default 1 hour |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX_REQUESTS` | Global API limiter |

## Example `.env` (local phone login without SMS)

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=dev-secret
JWT_REFRESH_SECRET=dev-refresh-secret
USE_MSG91_SMS=false
```

## Example production phone SMS (after DLT)

```env
USE_MSG91_SMS=true
MSG91_AUTH_KEY=your_auth_key
MSG91_TEMPLATE_ID=your_template_id
```
