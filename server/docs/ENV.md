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
| ~~`USE_MSG91_SMS`~~ | *(removed)* | Phone OTP mode is **platform-based** via `X-Client-Platform` (`web` → Dev OTP in response; `android`/`ios` → MSG91 SMS, no OTP in response). |
| `MSG91_AUTH_KEY` | *(empty unless set)* | MSG91 dashboard Authkey |
| `MSG91_FLOW_ID` | *(empty unless set)* | MSG91 **SMS Flow / Template** id (SMS → Templates). Preferred. |
| `MSG91_TEMPLATE_ID` | *(empty unless set)* | Legacy alias for flow id if `MSG91_FLOW_ID` is unset |
| `MSG91_SENDER_ID` | *(empty)* | Optional; only if the flow sender is FromAPI |
| `MSG91_OTP_VAR` | `number` | Flow variable name for the code (`##number##` → `number`). Case-sensitive. Comma-separated allowed. App also sends aliases (`number`, `OTP`, `VAR1`, …). |
| `ANDROID_SMS_APP_HASH` | release hash | 11-char SMS Retriever hash so Android autofills OTP **without** the Google Allow dialog. Default is GetMyPair release keystore hash. |
| `RETURN_OTP_IN_RESPONSE` | `false` | Portal / email OTP testing only (not phone login) |

### Phone OTP behaviour

1. `POST /api/auth/send-otp` always creates a **server-side** OTP (`otp.service`).
2. If `X-Client-Platform: android` or `ios` → `msg91.service` sends **MSG91 Flow SMS**. Response is `{ expiresIn }` only.
3. If `X-Client-Platform: web` → SMS skipped; response includes `{ expiresIn, otp }` for Flutter web Dev OTP.
4. Verify always uses the stored OTP (`POST /api/auth/verify-otp`), never MSG91 verify/OTP APIs.

India DLT: the SMS Flow template must map an approved DLT Template ID + sender ID, and content must match DLT exactly (use `{#var#}` on DLT, `##OTP##` on MSG91).

**API `200` ≠ SMS on the handset.** Check **MSG91 → SMS → Logs** (not OTP Logs) for Delivered / Pending / Failed.

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

## remove.bg (footwear cutouts)

| Variable | Notes |
|----------|--------|
| `REMOVE_BG_API_KEY` | **Required for cutouts.** Server-only. Used by `POST /api/articles/remove-background`. Never put this in the mobile app or `dart_defines`. Rotate if it was ever committed. Dashboard: https://www.remove.bg/dashboard#api-key |

If unset, that endpoint returns `503` and the mobile app keeps the original photo (soft-fail).

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

## Example `.env` (see also `server/.env.example`)

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=dev-secret
JWT_REFRESH_SECRET=dev-refresh-secret

# Footwear BG remover — server only (mobile must NOT embed this key)
REMOVE_BG_API_KEY=YOUR_REMOVE_BG_API_KEY

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

MSG91_AUTH_KEY=your_auth_key
MSG91_FLOW_ID=your_sms_flow_or_template_id
MSG91_OTP_VAR=number
# MSG91_SENDER_ID=YOURHDR   # only if flow sender is FromAPI
# Phone OTP: Android/iOS → MSG91; Flutter web → Dev OTP (X-Client-Platform)
```

## Example production (Render Environment)

```env
NODE_ENV=production
MSG91_AUTH_KEY=your_auth_key
MSG91_FLOW_ID=your_sms_flow_or_template_id
MSG91_OTP_VAR=number
REMOVE_BG_API_KEY=YOUR_REMOVE_BG_API_KEY
```

On Render, set at least `NODE_ENV=production`, `MSG91_AUTH_KEY`, `MSG91_FLOW_ID`, `MSG91_OTP_VAR=number`, and `REMOVE_BG_API_KEY` for footwear cutouts. Android/iOS use MSG91; Flutter web gets Dev OTP via `X-Client-Platform: web`.
