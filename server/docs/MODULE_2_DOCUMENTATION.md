# Module 2 — Profile & Geocode APIs

## Overview

Module 2 covers **user**, **cobbler**, **delivery**, and **admin** profile management, plus **geocode** (reverse lookup). All profile routes require **JWT** (`Authorization: Bearer <accessToken>`) and the correct **role** (USER, COBBER, DELIVERY, ADMIN). User profile is implemented in `server/src/routes/userProfile.routes.js`, `server/src/controllers/userProfile.controller.js`, and `server/src/validations/userProfile.validation.js`.

---

## All APIs (Module 2) — Summary

| Role    | Base Path                 | APIs |
|---------|---------------------------|------|
| USER    | `/api/user/profile`       | 7 (create, me, update, upload-image, address add/update/delete) |
| COBBER  | `/api/cobbler/profile`    | 10 (create, me, update, shop, services, tools-owned, tools-needed, upload-image, upload-doc, verification) |
| DELIVERY| `/api/delivery/profile`   | 7 (create, me, update, vehicle, upload-doc, upload-image, verification) |
| ADMIN   | `/api/admin/profile`      | 6 (users, cobblers, delivery, :id, verify, status) |
| Public  | `/api/geocode`            | 1 (reverse) |

---

# User Profile APIs (Role: USER)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/api/user/profile/create` | Create user profile |
| GET    | `/api/user/profile/me` | Get own profile |
| PUT    | `/api/user/profile/update` | Update profile (name, email) |
| POST   | `/api/user/profile/upload-image` | Upload profile image (multipart) |
| POST   | `/api/user/profile/address/add` | Add address |
| PUT    | `/api/user/profile/address/update` | Update address |
| DELETE | `/api/user/profile/address/delete/:addressId` | Delete address |

## User — Create Profile

**POST** `/api/user/profile/create`  
**Auth:** Bearer JWT, role USER

**Request:**
```json
{
  "name": "John Doe",
  "phone": "9876543210",
  "email": "john@example.com"
}
```
- `name` (required): 2–100 chars  
- `phone` (required): 10–15 chars  
- `email` (optional): valid email  

**Response:** 201 — profile created. 409 if profile already exists.

---

## User — Get Profile

**GET** `/api/user/profile/me`  
**Auth:** Bearer JWT, role USER

**Response:** 200 — `{ success, message, data: { profile } }`. If no profile exists, one is **auto-created** from the authenticated user (name, mobile, email) and then returned (200).

---

## User — Update Profile

**PUT** `/api/user/profile/update`  
**Auth:** Bearer JWT, role USER

**Request:**
```json
{
  "name": "John Updated",
  "email": "john.updated@example.com"
}
```
Only provided fields are updated.

---

## User — Upload Profile Image

**POST** `/api/user/profile/upload-image`  
**Auth:** Bearer JWT, role USER  
**Content-Type:** `multipart/form-data`  
**Body:** `file` (image). Allowed: JPEG, JPG, PNG, WEBP. Max 5MB. Stored in Cloudinary folder `getmypair/profiles`. Old image is deleted when uploading a new one.

**Response:** 200 — `{ success, message, data: { profileImage, cloudinaryId } }` (no full `profile` in response).

---

## User — Add Address

**POST** `/api/user/profile/address/add`  
**Auth:** Bearer JWT, role USER

**Request:**
```json
{
  "addressLine1": "123 Main Street, Sector 5",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001"
}
```
**Validation:** `addressLine1` (required, max 500), `city` (required, max 100), `state` (required, max 100), `pincode` (required, 4–10 digits).

**Response:** 201 — `{ success, message, data: { address, totalAddresses } }`. 404 if profile not found (create profile first).

---

## User — Update Address

**PUT** `/api/user/profile/address/update`  
**Auth:** Bearer JWT, role USER

**Request:**
```json
{
  "addressId": "664a1b2c3d4e5f6a7b8c9d10",
  "addressLine1": "456 New Street",
  "city": "Delhi",
  "state": "Delhi",
  "pincode": "110001"
}
```
- `addressId` (required): MongoDB ObjectId of address.

**Response:** 200 — `{ success, message, data: { address } }`

---

## User — Delete Address

**DELETE** `/api/user/profile/address/delete/:addressId`  
**Auth:** Bearer JWT, role USER

**Response:** 200 — `{ success, message, data: { totalAddresses } }`. 404 if profile or address not found.

---

# Cobbler Profile APIs (Role: COBBER)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/api/cobbler/profile/create` | Create cobbler profile |
| GET    | `/api/cobbler/profile/me` | Get own profile |
| PUT    | `/api/cobbler/profile/update` | Update profile (name, phone) |
| PUT    | `/api/cobbler/profile/shop` | Update shop details |
| PUT    | `/api/cobbler/profile/services` | Update services & service areas |
| PUT    | `/api/cobbler/profile/tools-owned` | Update tools owned |
| PUT    | `/api/cobbler/profile/tools-needed` | Update tools needed |
| POST   | `/api/cobbler/profile/upload-image` | Upload profile image |
| POST   | `/api/cobbler/profile/upload-doc` | Upload KYC document |
| GET    | `/api/cobbler/profile/verification` | Get verification status |

## Cobbler — Create Profile

**POST** `/api/cobbler/profile/create`  
**Auth:** Bearer JWT, role COBBER

**Request:**
```json
{
  "name": "Raju Cobbler",
  "phone": "9876543210"
}
```
- `name` (required): 2–100 chars  
- `phone` (required): 10–15 chars  

**Response:** 201 — profile created. 409 if profile already exists.

---

## Cobbler — Get Profile

**GET** `/api/cobbler/profile/me`  
**Auth:** Bearer JWT, role COBBER

**Response:** 200 — full profile (shop, services, tools, KYC, verification). 404 if no profile.

---

## Cobbler — Update Profile

**PUT** `/api/cobbler/profile/update`  
**Auth:** Bearer JWT, role COBBER

**Request:**
```json
{
  "name": "Raju Updated",
  "phone": "9876543211"
}
```

---

## Cobbler — Update Shop

**PUT** `/api/cobbler/profile/shop`  
**Auth:** Bearer JWT, role COBBER

**Request:**
```json
{
  "shopName": "Raju Shoe Repair",
  "shopAddress": "123 Main Street, Connaught Place, Delhi"
}
```
- Max length: shopName 200, shopAddress 500.

---

## Cobbler — Update Services

**PUT** `/api/cobbler/profile/services`  
**Auth:** Bearer JWT, role COBBER

**Request:**
```json
{
  "servicesOffered": ["shoe repair", "polish", "sole replacement", "stitching"],
  "serviceAreas": ["Connaught Place", "Karol Bagh", "Rajouri Garden"]
}
```
Both are arrays of strings.

---

## Cobbler — Update Tools Owned

**PUT** `/api/cobbler/profile/tools-owned`  
**Auth:** Bearer JWT, role COBBER

**Request:**
```json
{
  "toolsOwned": ["hammer", "needle", "thread", "adhesive", "knife"]
}
```
Replaces entire array.

---

## Cobbler — Update Tools Needed

**PUT** `/api/cobbler/profile/tools-needed`  
**Auth:** Bearer JWT, role COBBER

**Request:**
```json
{
  "toolsNeeded": ["shoe stretcher", "edge trimmer", "leather cutter"]
}
```
Replaces entire array.

---

## Cobbler — Upload Profile Image

**POST** `/api/cobbler/profile/upload-image`  
**Auth:** Bearer JWT, role COBBER  
**Content-Type:** `multipart/form-data`, field `file`.  
Allowed: JPEG, JPG, PNG, WEBP. Max 5MB. Stored in Cloudinary (`getmypair/profiles`).

**Response:** 200 — `{ success, message, data: { profileImage, cloudinaryId } }`

---

## Cobbler — Upload KYC Document

**POST** `/api/cobbler/profile/upload-doc`  
**Auth:** Bearer JWT, role COBBER  
**Content-Type:** `multipart/form-data`  
**Body:** `file` (image/PDF), `docType` (required).

**docType:** `aadhaar` | `pan` | `voter_id` | `driving_license` | `other`  
Allowed: JPEG, JPG, PNG, WEBP, PDF. Max 10MB. Stored in Cloudinary (`getmypair/kyc`).

**Response:** 201 — `{ success, message, data: { document, cloudinaryId, totalDocs } }`

---

## Cobbler — Get Verification Status

**GET** `/api/cobbler/profile/verification`  
**Auth:** Bearer JWT, role COBBER

**Response:** 200 — `{ success, message, data: { verificationStatus, kycDocsCount, kycDocs } }`  
- `verificationStatus`: `pending` | `verified` | `rejected`

---

# Delivery Profile APIs (Role: DELIVERY)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/api/delivery/profile/create` | Create delivery profile |
| GET    | `/api/delivery/profile/me` | Get own profile |
| PUT    | `/api/delivery/profile/update` | Update profile (name, phone) |
| PUT    | `/api/delivery/profile/vehicle` | Update vehicle details |
| POST   | `/api/delivery/profile/upload-doc` | Upload document |
| POST   | `/api/delivery/profile/upload-image` | Upload profile image |
| GET    | `/api/delivery/profile/verification` | Get verification status |

## Delivery — Create Profile

**POST** `/api/delivery/profile/create`  
**Auth:** Bearer JWT, role DELIVERY

**Request:**
```json
{
  "name": "Suresh Kumar",
  "phone": "9876543210"
}
```

**Response:** 201 — profile created. 409 if already exists.

---

## Delivery — Get Profile

**GET** `/api/delivery/profile/me`  
**Auth:** Bearer JWT, role DELIVERY

**Response:** 200 — profile. 404 if not found.

---

## Delivery — Update Profile

**PUT** `/api/delivery/profile/update`  
**Auth:** Bearer JWT, role DELIVERY

**Request:**
```json
{
  "name": "Suresh Updated",
  "phone": "9876543211"
}
```

---

## Delivery — Update Vehicle

**PUT** `/api/delivery/profile/vehicle`  
**Auth:** Bearer JWT, role DELIVERY

**Request:**
```json
{
  "vehicleType": "bike",
  "vehicleNumber": "DL01AB1234"
}
```
- `vehicleType`: `bicycle` | `bike` | `scooter` | `auto` | `car` | `van` | `other`

---

## Delivery — Upload Document

**POST** `/api/delivery/profile/upload-doc`  
**Auth:** Bearer JWT, role DELIVERY  
**Content-Type:** `multipart/form-data`: `file`, `docType`.

**docType:** `aadhaar` | `pan` | `driving_license` | `vehicle_rc` | `insurance` | `other`

**Response:** 201 — document uploaded.

---

## Delivery — Upload Profile Image

**POST** `/api/delivery/profile/upload-image`  
**Auth:** Bearer JWT, role DELIVERY  
**Content-Type:** `multipart/form-data`, field `file`.

**Response:** 200 — image URL/data.

---

## Delivery — Get Verification Status

**GET** `/api/delivery/profile/verification`  
**Auth:** Bearer JWT, role DELIVERY

**Response:** 200 — verification status and documents.

---

# Admin Profile APIs (Role: ADMIN)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/admin/profile/users` | Get all users (paginated) |
| GET    | `/api/admin/profile/cobblers` | Get all cobblers (paginated, optional status) |
| GET    | `/api/admin/profile/delivery` | Get all delivery partners (paginated, optional status) |
| GET    | `/api/admin/profile/:id` | Get any profile by ID |
| PUT    | `/api/admin/profile/verify` | Set verification status (cobbler/delivery) |
| PUT    | `/api/admin/profile/status` | Activate/deactivate user account |

## Admin — Get All Users

**GET** `/api/admin/profile/users`  
**Auth:** Bearer JWT, role ADMIN

**Query:** `page` (default 1), `limit` (default 20)

**Response:** 200 — paginated list of user profiles.

---

## Admin — Get All Cobblers

**GET** `/api/admin/profile/cobblers`  
**Auth:** Bearer JWT, role ADMIN

**Query:** `page`, `limit`, `status` (optional: `pending` | `verified` | `rejected`)

**Response:** 200 — paginated list of cobbler profiles.

---

## Admin — Get All Delivery Partners

**GET** `/api/admin/profile/delivery`  
**Auth:** Bearer JWT, role ADMIN

**Query:** `page`, `limit`, `status` (optional: `pending` | `verified` | `rejected`)

**Response:** 200 — paginated list of delivery profiles.

---

## Admin — Get Profile by ID

**GET** `/api/admin/profile/:id`  
**Auth:** Bearer JWT, role ADMIN

**Response:** 200 — user, cobbler, or delivery profile by profile ID. 404 if not found.

---

## Admin — Verify Profile

**PUT** `/api/admin/profile/verify`  
**Auth:** Bearer JWT, role ADMIN

**Request:**
```json
{
  "profileId": "...",
  "status": "verified"
}
```
- `status`: `pending` | `verified` | `rejected`  
Used for cobbler/delivery verification.

**Response:** 200 — verification updated. 404 if profile not found.

---

## Admin — Update Account Status

**PUT** `/api/admin/profile/status`  
**Auth:** Bearer JWT, role ADMIN

**Request:**
```json
{
  "userId": "...",
  "isActive": true
}
```

**Response:** 200 — account status updated. 404 if user not found.

---

# Geocode API (Public)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/geocode/reverse` | Reverse geocode (lat/lon → location) |

## Geocode — Reverse

**GET** `/api/geocode/reverse`  
**Auth:** None (public)

**Query:**
- `lat` (required): latitude  
- `lon` (required): longitude  

**Example:** `GET /api/geocode/reverse?lat=28.6139&lon=77.2090`

**Response (200):**
```json
{
  "success": true,
  "message": "Location retrieved successfully",
  "data": {
    "location": { ... }
  }
}
```

**Errors:** 400 if `lat` or `lon` missing. 500 on geocode failure.

---

## Backend Files (Module 2 — User Profile)

| Layer | File |
|-------|------|
| Routes | `server/src/routes/userProfile.routes.js` |
| Controller | `server/src/controllers/userProfile.controller.js` |
| Validation | `server/src/validations/userProfile.validation.js` |
| Model | `server/src/models/userProfile.model.js` |
| Upload | `server/src/middleware/upload.middleware.js`, `server/src/config/cloudinary.js` |
| App mount | `server/src/app.js` — `/api/user/profile` |

---

## Standard Response Format (Module 2)

**Success:** `{ "success": true, "message": "...", "data": { ... } }`  
**Error:** `{ "success": false, "message": "...", "errors": [...] }`

**Common status codes:** 400 validation, 401 unauthorized, 403 wrong role, 404 not found, 409 conflict (e.g. profile exists), 500 server error.
