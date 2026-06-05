# GetMyPair API Catalog

Reference: route mounts in `server/src/app.js` and definitions in `server/src/routes/*.routes.js`.  
Line numbers point to the **route file** where `router.<method>(...)` is declared.

**Narrative docs:** [README.md](README.md) · [Module 1](MODULE_1_DOCUMENTATION.md) · [Module 2](MODULE_2_DOCUMENTATION.md) · [Module 3](MODULE_3_DOCUMENTATION.md) · [Module 4](MODULE_4_DOCUMENTATION.md) · [Admin dashboard](ADMIN_DASHBOARD.md)

---

## App & documentation

| Method | Path | File | Line | Notes |
|--------|------|------|------|-------|
| GET | `/health` | `app.js` | 103 | Health check JSON |
| GET | `/api/version` | `app.js` | 112 | Package version JSON |
| GET | `/admin` | `app.js` | 86 | Redirect to `/admin/` |
| — | `/api-docs` | `app.js` | 98 | Swagger UI (main API) |
| — | `/api-docs/admin` | `app.js` | 92 | Swagger UI (admin API) |
| — | `/uploads/*` | `app.js` | 139 | Static uploads |

---

## Module 1 — Authentication

**Base:** `/api/auth`  
**File:** `server/src/routes/auth.routes.js`

| Method | Full path | Line | Controller handler |
|--------|-----------|------|----------------------|
| POST | `/api/auth/send-otp` | 32 | `sendOTP` |
| POST | `/api/auth/verify-otp` | 33 | `verifyOTP` |
| POST | `/api/auth/complete-profile` | 34 | `completeProfile` |
| POST | `/api/auth/refresh-token` | 35 | `refreshToken` |
| POST | `/api/auth/logout` | 36 | `logout` |
| GET | `/api/auth/me` | 37 | `getCurrentUser` |

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
| DELETE | `/api/user/profile/address/delete/:addressId` | 70 | `deleteAddress` |

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

### Admin profile (mobile JWT)

**Base:** `/api/admin/profile`  
**File:** `server/src/routes/adminProfile.routes.js`  
**Auth:** JWT + role `ADMIN`  
*(Separate from master HTML admin under `/api/sys-admin`.)*

| Method | Full path | Line | Controller handler |
|--------|-----------|------|----------------------|
| GET | `/api/admin/profile/users` | 32 | `getAllUsers` |
| GET | `/api/admin/profile/cobblers` | 33 | `getAllCobblers` |
| GET | `/api/admin/profile/delivery` | 34 | `getAllDeliveryPartners` |
| GET | `/api/admin/profile/:id` | 35 | `getProfileById` |
| PUT | `/api/admin/profile/verify` | 36 | `verifyProfile` |
| PUT | `/api/admin/profile/status` | 37 | `updateAccountStatus` |

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

## Master admin dashboard (sys-admin)

**Base:** `/api/sys-admin`  
**File:** `server/src/routes/adminDashboard.routes.js`  
**Auth:** Master admin session / cookie (see `adminMasterAuth.middleware`); login route is public.

| Method | Full path | Line | Controller handler |
|--------|-----------|------|----------------------|
| POST | `/api/sys-admin/auth/login` | 17 | `login` |
| GET | `/api/sys-admin/auth/me` | 25 | `me` |
| GET | `/api/sys-admin/dashboard/stats` | 26 | `dashboardStats` |
| GET | `/api/sys-admin/users` | 27 | `listUsers` |
| DELETE | `/api/sys-admin/users/:id` | 28 | `deleteUser` |
| GET | `/api/sys-admin/articles/by-owner` | 29 | `listArticleOwnersSummary` |
| GET | `/api/sys-admin/articles` | 34 | `listArticles` |
| GET | `/api/sys-admin/service-requests` | 35 | `listServiceRequests` |
| GET | `/api/sys-admin/service-requests/:id` | 36 | `getServiceRequestById` |
| PATCH | `/api/sys-admin/service-requests/:id` | 41 | `patchServiceRequestWorkflow` |
| DELETE | `/api/sys-admin/service-requests/:id` | 46 | `deleteServiceRequest` |
| GET | `/api/sys-admin/cobblers` | 51 | `listCobblers` |
| PATCH | `/api/sys-admin/cobblers/:id/verify` | 52 | `verifyCobbler` |
| GET | `/api/sys-admin/delivery-partners` | 53 | `listDeliveryPartners` |

---

## OpenAPI (Swagger) sources

Path definitions live under `server/src/docs/*.paths.js` and are served at `/api-docs` and `/api-docs/admin`.

---

*Generated for internal reference; update this file when routes change.*
