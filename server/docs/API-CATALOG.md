# GetMyPair API Catalog

Reference: route mounts in `server/src/app.js` and definitions in `server/src/routes/*.routes.js`.  
Line numbers point to the **route file** where `router.<method>(...)` is declared.

**Narrative docs:** [README.md](README.md) · [Module 1](MODULE_1_DOCUMENTATION.md) · [Module 2](MODULE_2_DOCUMENTATION.md) · [Module 3](MODULE_3_DOCUMENTATION.md) · [Module 4](MODULE_4_DOCUMENTATION.md) · [Module 5 — Payment](MODULE_5_PAYMENT.md) · [Module 6 — Sell My Pair](MODULE_6_SELL_MY_PAIR.md) · [ENV](ENV.md) · [Admin dashboard](ADMIN_DASHBOARD.md)

---

## App & documentation

| Method | Path | File | Line | Notes |
|--------|------|------|------|-------|
| GET | `/health` | `app.js` | 103 | Health check JSON |
| GET | `/api/version` | `app.js` | 112 | Package version JSON |
| GET | `/admin` | `app.js` | — | **Removed** — HTML admin UI deleted; use React client |
| — | `/api-docs/masteradmin` | `app.js` | — | Masteradmin Dashboard Swagger |
| — | `/api-docs/admin` | `app.js` | — | Legacy alias → Masteradmin Swagger |
| — | `/api-docs` | `app.js` | — | Swagger hub (per-app table) |
| — | `/api-docs/user` | `app.js` | — | User App Swagger |
| — | `/api-docs/cobbler` | `app.js` | — | Cobbler App Swagger |
| — | `/api-docs/delivery` | `app.js` | — | Delivery App Swagger |
| — | `/api-docs/repairshops` | `app.js` | — | Repairshops Dashboard Swagger |
| — | `/api-docs/retailer` | `app.js` | — | Retailer App Swagger |
| — | `/api-docs/all` | `app.js` | — | Full API catalog Swagger |
| — | `/uploads/*` | `app.js` | — | Static uploads |

---

## Module 1 — Authentication

**Base:** `/api/auth`  
**File:** `server/src/routes/auth.routes.js`  
**Phone OTP:** [MODULE_1_DOCUMENTATION.md](MODULE_1_DOCUMENTATION.md) · [ENV.md](ENV.md) (`USE_MSG91_SMS`)

| Method | Full path | Line | Controller handler |
|--------|-----------|------|----------------------|
| POST | `/api/auth/send-otp` | 37 | `sendOTP` |
| POST | `/api/auth/verify-otp` | 38 | `verifyOTP` |
| POST | `/api/auth/complete-profile` | 39 | `completeProfile` |
| POST | `/api/auth/refresh-token` | 40 | `refreshToken` |
| POST | `/api/auth/logout` | 41 | `logout` |
| GET | `/api/auth/sessions` | 44 | `listUserSessions` |
| DELETE | `/api/auth/sessions/:sessionId` | 45 | `revokeSession` |
| GET | `/api/auth/me` | 47 | `getCurrentUser` |
| GET | `/api/auth/languages` | 48 | `getSupportedLanguages` |
| PUT | `/api/auth/language` | 49 | `updatePreferredLanguage` |

---

## Module 2 — Profiles

### User profile

**Base:** `/api/user/profile`  
**File:** `server/src/routes/userProfile.routes.js`  
**Auth:** JWT + role `USER`

| Method | Full path | Line | Controller handler |
|--------|-----------|------|----------------------|
| GET | `/api/user/profile/me` | 39 | `getProfile` |
| GET | `/api/user/profile/addresses` | 44 | `listAddresses` |
| PUT | `/api/user/profile` | 49 | `updateProfile` (no create; profile from `complete-profile`) |
| PUT | `/api/user/profile/update` | 50 | `updateProfile` |
| POST | `/api/user/profile/upload-image` | 55 | `uploadProfileImage` |
| POST | `/api/user/profile/address/add` | 60 | `addAddress` |
| PUT | `/api/user/profile/address/update` | 65 | `updateAddress` |
| DELETE | `/api/user/profile/address/delete/:addressId` | 73 | `deleteAddress` |
| POST | `/api/user/profile/family-members/add` | 78 | `addFamilyMember` |
| PUT | `/api/user/profile/family-members/update` | 79 | `updateFamilyMember` |
| DELETE | `/api/user/profile/family-members/delete/:memberId` | 80 | `deleteFamilyMember` |
| POST | `/api/user/profile/family-members/upload-image` | 81 | `uploadFamilyMemberImage` |
| PUT | `/api/user/profile/switch` | 86 | `switchActiveProfile` |

### Cobbler profile

**Base:** `/api/cobbler/profile`  
**File:** `server/src/routes/cobblerProfile.routes.js`  
**Auth:** JWT + role `COBBER`

| Method | Full path | Line | Controller handler |
|--------|-----------|------|----------------------|
| GET | `/api/cobbler/profile/me` | 43 | `getProfile` |
| PUT | `/api/cobbler/profile` | 48 | `updateProfile` |
| PUT | `/api/cobbler/profile/update` | 49 | `updateProfile` |
| PUT | `/api/cobbler/profile/shop` | 54 | `updateShopDetails` |
| PUT | `/api/cobbler/profile/services` | 59 | `updateServices` |
| PUT | `/api/cobbler/profile/tools-owned` | 64 | `updateToolsOwned` |
| PUT | `/api/cobbler/profile/tools-needed` | 69 | `updateToolsNeeded` |
| PUT | `/api/cobbler/profile/bank` | 74 | `updateBankDetails` |
| POST | `/api/cobbler/profile/upload-image` | 79 | `uploadProfileImage` |
| POST | `/api/cobbler/profile/upload-doc` | 84 | `uploadKycDoc` |
| PUT | `/api/cobbler/profile/update-status` | 89 | `updateStatus` |
| GET | `/api/cobbler/profile/verification` | 94 | `getVerificationStatus` |

### Cobbler home (dashboard)

**Base:** `/api/cobbler/home`  
**File:** `server/src/routes/cobblerHome.routes.js`  
**Auth:** JWT + role `COBBER`

| Method | Full path | Line | Controller handler |
|--------|-----------|------|----------------------|
| GET | `/api/cobbler/home/dashboard` | 10 | `getDashboard` |

### Delivery profile

**Base:** `/api/delivery/profile`  
**File:** `server/src/routes/deliveryProfile.routes.js`  
**Auth:** JWT + role `DELIVERY`

| Method | Full path | Line | Controller handler |
|--------|-----------|------|----------------------|
| GET | `/api/delivery/profile/me` | 33 | `getProfile` |
| PUT | `/api/delivery/profile` | 34 | `updateProfile` |
| PUT | `/api/delivery/profile/update` | 35 | `updateProfile` |
| PUT | `/api/delivery/profile/vehicle` | 36 | `updateVehicleDetails` |
| POST | `/api/delivery/profile/upload-doc` | 37 | `uploadDocument` |
| POST | `/api/delivery/profile/upload-image` | 38 | `uploadProfileImage` |
| GET | `/api/delivery/profile/verification` | 39 | `getVerificationStatus` |

### Admin profile (mobile JWT) — Retailer legacy

**Base:** `/api/admin/profile` (legacy) · canonical: `/api/retailer/profile`  
**Files:** `adminProfile.routes.js`, `retailer.routes.js`  
**Auth:** JWT + role `ADMIN`  
*(Separate from Masteradmin / Repairshops under `/api/masteradmin` and `/api/repairshops`.)*

| Method | Full path | Line | Controller handler |
|--------|-----------|------|----------------------|
| GET | `/api/admin/profile/users` | 32 | `getAllUsers` |
| GET | `/api/admin/profile/cobblers` | 33 | `getAllCobblers` |
| GET | `/api/admin/profile/delivery` | 34 | `getAllDeliveryPartners` |
| GET | `/api/admin/profile/:id` | 35 | `getProfileById` |
| PUT | `/api/admin/profile/verify` | 36 | `verifyProfile` |
| PUT | `/api/admin/profile/status` | 37 | `updateAccountStatus` |

Same handlers also mounted under `/api/retailer/profile/*`.

---

## Geocoding

**Base:** `/api/geocode`  
**File:** `server/src/routes/geocode.routes.js`  
**Auth:** none (public)

| Method | Full path | Line | Controller handler |
|--------|-----------|------|----------------------|
| GET | `/api/geocode/reverse` | 26 | `reverse` |

---

## Module 3 — Articles (Digital Shoe Passport)

**Base:** `/api/articles`  
**File:** `server/src/routes/article.routes.js`  
**Auth:** JWT + role `USER`

| Method | Full path | Line | Controller handler |
|--------|-----------|------|----------------------|
| POST | `/api/articles/create` | 20 | `createArticle` |
| GET | `/api/articles/my` | 21 | `getMyArticles` |
| GET | `/api/articles/:articleId` | 22 | `getArticleById` |
| PUT | `/api/articles/update/:articleId` | 23 | `updateArticle` |
| DELETE | `/api/articles/delete/:articleId` | 24 | `deleteArticle` |
| POST | `/api/articles/upload-image` | 25 | `uploadArticleImage` |

---

## Module 6 — Sell My Pair

**Base:** `/api/sell`  
**File:** `server/src/routes/sell.routes.js`  
**Auth:** JWT + role `USER`  
**Doc:** [MODULE_6_SELL_MY_PAIR.md](MODULE_6_SELL_MY_PAIR.md)

| Method | Full path | Line | Controller handler |
|--------|-----------|------|----------------------|
| POST | `/api/sell/upload-proof` | 12 | `uploadProof` |
| POST | `/api/sell/listings` | 13 | `createListing` |
| GET | `/api/sell/listings` | 14 | `listMine` |

### Masteradmin review

| Method | Full path | Controller handler |
|--------|-----------|----------------------|
| GET | `/api/masteradmin/sell-listings` | `adminList` |
| GET | `/api/masteradmin/sell-listings/:id` | `adminGet` |
| PATCH | `/api/masteradmin/sell-listings/:id/review` | `adminReview` |

---

## Module 4 — Service requests

**Base:** `/api/service`  
**File:** `server/src/routes/service.routes.js`  
**Auth:** JWT on all routes; per-route `roleMiddleware` as in code.

### User service flow

| Method | Full path | Line | Controller handler |
|--------|-----------|------|----------------------|
| GET | `/api/service/my` | 36 | `getMyServiceRequests` |
| GET | `/api/service/estimation-defaults` | 37 | `getEstimationDefaults` |
| POST | `/api/service/create` | 38 | `createServiceRequest` |
| POST | `/api/service/upload-proof/image` | 39 | `uploadServiceProofImage` |
| POST | `/api/service/upload-proof/video` | 45 | `uploadServiceProofVideo` |
| PUT | `/api/service/cancel/:requestId` | 69 | `cancelServiceRequest` |
| POST | `/api/service/respond-actual-cost` | 75 | `respondToActualCost` |
| GET | `/api/service/:requestId` | 120 | `getServiceRequestDetails` |

### Admin / cobbler operations & media

| Method | Full path | Line | Controller handler |
|--------|-----------|------|----------------------|
| POST | `/api/service/assign-delivery` | 51 | `assignDeliveryPartner` |
| POST | `/api/service/assign-darkstore` | 57 | `assignDarkStore` |
| POST | `/api/service/update-status` | 63 | `updateServiceStatus` |
| POST | `/api/service/upload-media` | 81 | `uploadServiceMedia` |

### Cobbler job flow

| Method | Full path | Line | Controller handler |
|--------|-----------|------|----------------------|
| GET | `/api/service/cobbler/new-requests` | 89 | `cobblerListNewRequests` |
| GET | `/api/service/cobbler/active` | 95 | `cobblerListActiveRequests` |
| POST | `/api/service/cobbler/accept` | 101 | `cobblerAcceptRequest` |
| POST | `/api/service/cobbler/reject` | 107 | `cobblerRejectRequest` |
| POST | `/api/service/cobbler/set-actual-cost` | 113 | `cobblerSetActualCost` |

---

## Module 5 — Payments (Zoho)

**Base:** `/api/payment`  
**File:** `server/src/routes/payment.routes.js`  
**Doc:** [MODULE_5_PAYMENT.md](MODULE_5_PAYMENT.md)

| Method | Full path | Description |
|--------|-----------|-------------|
| POST | `/api/payment/webhook/zoho` | Zoho callback (mounted in `app.js`) |
| POST | `/api/payment/order` | Create payment order |
| POST | `/api/payment/link` | Generate payment link |
| POST | `/api/payment/verify` | Verify payment |
| POST | `/api/payment/cost/approve` | User cost approval |
| POST | `/api/payment/cost/reject` | User cost rejection |
| GET | `/api/payment/history` | User transactions |
| GET | `/api/payment/:paymentId` | Payment details |
| GET | `/api/payment/cobbler/earnings` | Cobbler earnings |
| GET | `/api/payment/darkstore/:darkStoreId/revenue` | Dark store revenue |
| POST | `/api/payment/settlement/process` | Process settlement |
| POST | `/api/payment/refund` | Refund |
| GET | `/api/payment/admin/report` | Payment report |
| GET | `/api/payment/admin/commission-preview` | Commission split preview |

---

## Masteradmin dashboard

**Base:** `/api/masteradmin` (legacy alias: `/api/sys-admin`)  
**File:** `server/src/routes/masteradmin.routes.js`  
**Auth:** Masteradmin JWT (`adminMasterAuth`); login / OTP steps are public.  
**Doc:** [ADMIN_DASHBOARD.md](ADMIN_DASHBOARD.md)

| Area | Paths |
|------|--------|
| Auth | `POST .../auth/login`, `verify-otp`, `resend-otp`, forgot-password flow, `GET .../auth/me` |
| Stats | `GET .../dashboard/stats` |
| Users | `GET/DELETE .../users` |
| Articles | `GET .../articles` |
| **Sell My Pair** | `GET .../sell-listings`, `GET .../sell-listings/:id`, `PATCH .../sell-listings/:id/review` |
| Service requests | `GET/PATCH/DELETE .../service-requests` |
| Cobblers | `GET .../cobblers`, `PATCH .../cobblers/:id/verify` |
| Delivery partners / members / jobs | `.../delivery-partners`, `.../delivery-members`, `.../delivery-jobs/*` |
| Repairshops users | `.../repairshops-users` (legacy `darkworkstore-users` aliases) |
| Payments | `.../payments/*` |
| Email templates | `GET .../email-templates` |
| DB maintenance | `.../db/*` |

## Repairshops dashboard

**Base:** `/api/repairshops` (legacy alias: `/api/darkworkstore`)  
**File:** `server/src/routes/repairshops.routes.js`  
**Auth:** portal JWT; login is public.

Includes `/auth/*`, jobs, cobbler tools, and payments as implemented in the route file.

## Delivery portal

**Base:** `/api/delivery` (+ `/api/delivery/profile` for mobile profile)  
**Files:** `delivery.routes.js`, `deliveryProfile.routes.js`

---

## OpenAPI (Swagger) sources

Path definitions live under `server/src/docs/*.paths.js`. Per-app filtered Swagger UIs are served from `/api-docs/{user|cobbler|repairshops|masteradmin|retailer|delivery}`; hub at `/api-docs`; full catalog at `/api-docs/all`. Legacy `/api-docs/admin` → masteradmin.

---

*Update this file when routes change. Prefer narrative docs for request/response examples.*
