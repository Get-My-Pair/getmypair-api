# Zoho Payments OAuth Setup (India)

Step-by-step guide to configure **live Zoho Pay** for GetMyPair API.

| Item | Value |
|------|-------|
| Region | India (`.in`) |
| Accounts URL | `https://accounts.zoho.in` |
| Payments API | `https://payments.zoho.in/api/v1` |
| Callback URL | `https://getmypair-api.onrender.com/api/payment/callback` |
| Helper script | `server/scripts/zoho-oauth.js` |

---

## Prerequisites

- Zoho Payments account with **Account Owner** or **Admin** role
- KYC / bank setup completed (required for live payment links)
- `server/.env` file (never commit to git)

---

## Environment variables

```env
# OAuth (Self Client — recommended)
ZOHO_CLIENT_ID=
ZOHO_CLIENT_SECRET=
ZOHO_REFRESH_TOKEN=

# Account
ZOHO_ACCOUNT_ID=
ZOHO_PAYMENT_CURRENCY=INR
ZOHO_ACCOUNTS_URL=https://accounts.zoho.in
ZOHO_PAYMENTS_BASE_URL=https://payments.zoho.in/api/v1

# Callback (same URL for OAuth and customer return after checkout)
ZOHO_REDIRECT_URI=https://getmypair-api.onrender.com/api/payment/callback
ZOHO_PAYMENT_RETURN_URL=https://getmypair-api.onrender.com/api/payment/callback

# Webhooks & signing (from Zoho Payments → Settings → Developer Space)
ZOHO_WEBHOOK_SECRET=
ZOHO_SIGNING_KEY=

# Optional short-lived fallback (~1 hour) — not for production
ZOHO_API_KEY=

# Local testing without Zoho
ZOHO_PAYMENTS_MOCK=false

API_PUBLIC_BASE_URL=https://getmypair-api.onrender.com
```

Copy the same Zoho variables to **Render → Environment** and redeploy after changes.

---

## Method 1 — Self Client (recommended)

No browser redirect. Best for server-side integration.

### 1. Create Self Client

1. Open [Zoho API Console (India)](https://api-console.zoho.in/) or [accounts.zoho.in/developerconsole](https://accounts.zoho.in/developerconsole)
2. Choose **Self Client** → **CREATE**
3. Open **Client Secret** tab → copy **Client ID** and **Client Secret**

### 2. Generate grant code

Open **Generate Code** tab:

| Field | Value |
|-------|-------|
| **Scope** | `ZohoPay.payments.CREATE,ZohoPay.payments.READ,ZohoPay.payments.UPDATE` |
| **Expiry** | 3 minutes |
| **Description** | `GetMyPair API server-side Zoho Payments integration for payment links and transaction verification` |

Click **CREATE** and copy the grant code immediately.

> **Important:** Use `ZohoPay.payments.*` — **not** `ZohoCheckout.payments.*`. Wrong scope causes `Not An Authorized User`.

### 3. Exchange grant code for refresh token

**Option A — CLI (saves to `.env` automatically):**

```bash
cd server
node scripts/zoho-oauth.js exchange-self --code=PASTE_GRANT_CODE
```

**Option B — PowerShell:**

```powershell
$code = "PASTE_GRANT_CODE"
$clientId = "YOUR_SELF_CLIENT_ID"
$clientSecret = "YOUR_SELF_CLIENT_SECRET"

Invoke-RestMethod -Method Post `
  -Uri "https://accounts.zoho.in/oauth/v2/token" `
  -ContentType "application/x-www-form-urlencoded" `
  -Body "code=$code&client_id=$clientId&client_secret=$clientSecret&grant_type=authorization_code"
```

Confirm response `scope` contains `ZohoPay.payments`, then save `refresh_token` to `.env`.

### 4. Verify

```bash
node scripts/zoho-oauth.js status
node scripts/zoho-oauth.js test
```

Success:

```
OAuth access token OK (first 12 chars): 1000.xxxxx…
Payment link API OK — test URL created: https://...
```

---

## Method 2 — ORG OAuth (browser flow)

Use when you prefer redirect-based setup with an **ORG** client.

### 1. Register ORG client

1. Open [api-console.zoho.in](https://api-console.zoho.in/) with **client type = ORG**
2. Create client **GetMyPair API**
3. **Authorized Redirect URI:**
   ```
   https://getmypair-api.onrender.com/api/payment/callback
   ```

### 2. Update `.env` with ORG Client ID + Secret

### 3. Run browser OAuth

```bash
node scripts/zoho-oauth.js auth-url
```

Open URL → accept as Zoho Payments Admin → copy `code` from redirect URL.

### 4. Exchange code

```bash
node scripts/zoho-oauth.js exchange --code=PASTE_CODE
```

Or deploy latest API — `/api/payment/callback` auto-exchanges OAuth redirects.

---

## CLI commands

| Command | Description |
|---------|-------------|
| `node scripts/zoho-oauth.js status` | Show config summary |
| `node scripts/zoho-oauth.js auth-url` | Print ORG browser OAuth URL |
| `node scripts/zoho-oauth.js exchange --code=...` | ORG client code exchange (needs redirect URI) |
| `node scripts/zoho-oauth.js exchange-self --code=...` | Self Client code exchange (no redirect) |
| `node scripts/zoho-oauth.js test` | Refresh token + create test payment link |

---

## Common errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Invalid Redirect Uri` | Redirect URL not registered in Zoho console | Add exact callback URL to ORG client |
| `Invalid Client` / `invalid_client` | Wrong client type, region, or ID/secret mismatch | Use Self Client or ORG client from `api-console.zoho.in`; match ID + secret + grant code from **same** app |
| `invalid_code` | Grant code expired (>3 min) or already used | Generate new code and exchange immediately |
| `Not An Authorized User` | Wrong scope (`ZohoCheckout` instead of `ZohoPay`) | Regenerate grant code with `ZohoPay.payments.*` scopes |
| `payments_not_enabled` | Zoho account not activated for collections | Complete KYC in Zoho Payments; email support@zohopayments.com with account ID |
| OAuth works, test fails on Render | Env vars not set on Render | Copy all `ZOHO_*` vars to Render and redeploy |

---

## Credential rules

1. **Grant code**, **Client ID**, and **Client Secret** must come from the **same** Zoho app.
2. Do **not** put Client ID in `ZOHO_API_KEY` — that field is for short-lived access tokens only.
3. `ZOHO_REFRESH_TOKEN` is long-lived; server refreshes access tokens automatically.
4. Grant codes expire in **3 minutes** and work **once**.

---

## Local development (mock mode)

While waiting for Zoho account activation:

```env
ZOHO_PAYMENTS_MOCK=true
```

Payment links use `/api/payment/mock-checkout?orderId=...` — no live Zoho API calls.

Set `ZOHO_PAYMENTS_MOCK=false` for production.

---

## Render deployment checklist

- [ ] `ZOHO_CLIENT_ID`
- [ ] `ZOHO_CLIENT_SECRET`
- [ ] `ZOHO_REFRESH_TOKEN`
- [ ] `ZOHO_ACCOUNT_ID`
- [ ] `ZOHO_REDIRECT_URI`
- [ ] `ZOHO_PAYMENT_RETURN_URL`
- [ ] `ZOHO_WEBHOOK_SECRET`
- [ ] `ZOHO_SIGNING_KEY`
- [ ] `ZOHO_PAYMENTS_MOCK=false`
- [ ] `API_PUBLIC_BASE_URL=https://getmypair-api.onrender.com`
- [ ] Redeploy after env changes
- [ ] `node scripts/zoho-oauth.js test` passes (after Zoho enables payments)

---

## Related files

| File | Purpose |
|------|---------|
| `server/scripts/zoho-oauth.js` | OAuth CLI helper |
| `server/src/services/zohoOAuth.service.js` | Token refresh & code exchange |
| `server/src/services/zohoPayment.service.js` | Payment link API calls |
| `server/src/config/zohoEnv.js` | Startup validation |
| `server/docs/MODULE_5_PAYMENT.md` | Payment workflow overview |

---

## References

- [Zoho Payments Authentication](https://www.zoho.com/in/payments/api/v1/authentication/)
- [Zoho Payments OAuth (Self Client)](https://www.zoho.com/in/payments/api/v1/oauth/)
- [ORG OAuth](https://www.zoho.com/in/payments/developerdocs/web-integration/org-oauth/)
