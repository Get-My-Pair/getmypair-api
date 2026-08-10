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
# Use the webhook *signing key* (not ZOHO_API_KEY). Header: X-Zoho-Webhook-Signature
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

## Testing options (choose one)

GetMyPair supports **three** payment test modes:

| Mode | When to use | Real Zoho checkout? | Code changes? |
|------|-------------|---------------------|---------------|
| **A. Internal mock** | Fastest local/dev testing | No — our `/mock-checkout` page | Set `ZOHO_PAYMENTS_MOCK=true` only |
| **B. Zoho Sandbox** | Full Zoho flow (cards, UPI, webhooks) | Yes — simulated, no real money | Sandbox `.env` + Zoho enables sandbox org |
| **C. Live production** | Real customer payments | Yes — real money | Current live credentials + Zoho enables account |

**Current integration status:** OAuth for **live** is configured correctly. Live payment links fail with `payments_not_enabled` until Zoho activates the production account. **No API code rewrite needed** — use mock (A) or sandbox (B) while waiting.

---

## A. Internal mock mode (ready now)

No Zoho account required. Use for app flow testing (pay now → success → pickup).

```env
ZOHO_PAYMENTS_MOCK=true
```

Payment links point to `/api/payment/mock-checkout?orderId=...` on your API.

Restart the server after changing `.env`. Set `ZOHO_PAYMENTS_MOCK=false` before production.

---

## B. Zoho Payments Sandbox

Official test environment: [Sandbox overview](https://www.zoho.com/in/payments/developerdocs/sandbox/) · [Test cards/UPI](https://www.zoho.com/in/payments/developerdocs/sandbox/testing/)

> **Contact Zoho support** to enable Sandbox for your org. Portal: [paymentssandbox.zoho.in](https://paymentssandbox.zoho.in/)

### Sandbox vs internal mock

| | Internal mock | Zoho Sandbox |
|---|---------------|--------------|
| Setup | One env flag | Separate sandbox org + credentials from Zoho |
| Checkout UI | Our HTML page | Real Zoho hosted checkout |
| Test cards (4111…) | N/A | Yes |
| Webhooks | N/A | Yes — configure in sandbox portal |
| OAuth scopes | N/A | `ZohoPaySandbox.payments.*` |

### Sandbox `.env` template

Copy `server/.env.sandbox.example` to `.env` (or use a separate Render **staging** service) and fill sandbox values from [paymentssandbox.zoho.in](https://paymentssandbox.zoho.in/):

```env
ZOHO_PAYMENTS_MOCK=false
ZOHO_PAYMENTS_BASE_URL=https://paymentssandbox.zoho.in/api/v1
ZOHO_ACCOUNT_ID=<sandbox account id>
ZOHO_CLIENT_ID=<sandbox self client id>
ZOHO_CLIENT_SECRET=<sandbox self client secret>
ZOHO_REFRESH_TOKEN=<sandbox refresh token>
ZOHO_REDIRECT_URI=https://getmypair-api.onrender.com/api/payment/callback
ZOHO_PAYMENT_RETURN_URL=https://getmypair-api.onrender.com/api/payment/callback
ZOHO_ACCOUNTS_URL=https://accounts.zoho.in
```

### Sandbox OAuth (Self Client)

1. In **sandbox** API console, create **Self Client**
2. **Generate Code** with scopes (one line):

```
ZohoPaySandbox.payments.CREATE,ZohoPaySandbox.payments.READ,ZohoPaySandbox.payments.UPDATE
```

3. Exchange within 3 minutes:

```bash
node scripts/zoho-oauth.js exchange-self --code=PASTE_CODE
```

4. Verify:

```bash
node scripts/zoho-oauth.js status   # should show SANDBOX mode
node scripts/zoho-oauth.js test     # creates test payment link on sandbox API
```

### Sandbox test payments

After a payment link opens in the browser, use Zoho test values ([full list](https://www.zoho.com/in/payments/developerdocs/sandbox/testing/)):

| Method | Test value | Result |
|--------|------------|--------|
| **Card (Visa)** | `4111 1111 1111 1111`, any future expiry, any CVV | Success |
| **Card failure** | Cardholder name: `Failure` | Auth failure |
| **UPI success** | Amount ≤ ₹500 (e.g. ₹100) | Success |
| **UPI failure** | Amount ₹501–₹1000 | Failure |
| **Net banking** | Success Test Bank | Success |

### Going live (sandbox → production)

When Zoho enables live payments:

1. Replace sandbox Client ID, Secret, Account ID, Refresh token with **live** values
2. `ZOHO_PAYMENTS_BASE_URL=https://payments.zoho.in/api/v1`
3. OAuth scopes: `ZohoPay.payments.*` (not `ZohoPaySandbox.*`)
4. `ZOHO_PAYMENTS_MOCK=false`
5. Register **production** webhooks and signing keys

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
- [Zoho Sandbox](https://www.zoho.com/in/payments/developerdocs/sandbox/)
- [Sandbox test cards / UPI](https://www.zoho.com/in/payments/developerdocs/sandbox/testing/)

---

## Message for team lead (summary)

**Integration status:** GetMyPair API payment module and Zoho OAuth are **implemented and correct** for live India (`payments.zoho.in`). Self Client refresh token works; scopes are `ZohoPay.payments.*`.

**Blocker on live:** Zoho returns `payments_not_enabled` — production account `60072201604` must be activated by Zoho (KYC / enable payment collection). Email **support@zohopayments.com**.

**What works today without live Zoho:**

1. **Internal mock** — set `ZOHO_PAYMENTS_MOCK=true`; full app pay flow via `/api/payment/mock-checkout` (no Zoho).
2. **Zoho Sandbox** (optional, closer to production) — request sandbox org from Zoho; use separate sandbox credentials and `ZOHO_PAYMENTS_BASE_URL=https://paymentssandbox.zoho.in/api/v1` with `ZohoPaySandbox.*` scopes. Test cards/UPI per [Zoho sandbox testing docs](https://www.zoho.com/in/payments/developerdocs/sandbox/testing/).

**No major code changes required** for sandbox — env + credentials only. Sandbox OAuth script and docs updated in `server/scripts/zoho-oauth.js` and this file.

**Before production go-live:** Copy live `ZOHO_*` vars to Render, `ZOHO_PAYMENTS_MOCK=false`, confirm `node scripts/zoho-oauth.js test` passes after Zoho enables the account.
