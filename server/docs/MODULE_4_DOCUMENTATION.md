# Module 4 — Service Request APIs

## Overview

Module 4 handles **service requests** linking a **user**, an **article** (shoe), and a **saved address**. Supports customer flows (create, list, cancel, accept/reject final cost), operations (delivery, dark store, status updates), and **cobbler** job management.

| Layer | Path |
|-------|------|
| Routes | `server/src/routes/service.routes.js` |
| Controller | `server/src/controllers/service.controller.js` |
| Validation | `server/src/validations/service.validation.js` |
| Model | `server/src/models/serviceRequest.model.js` |
| Mount | `app.use('/api/service', serviceRoutes)` |

All routes use `authMiddleware`; **per-route** `roleMiddleware([...])` applies.

---

## Service types & defaults

**`serviceType` enum:** `repair`, `maintenance`, `wash`, `donate`, `dispose`

**Default `estimatedCost`** when omitted on create (`defaultEstimatedCostByServiceType`):

| Type | Default |
|------|---------|
| repair | 500 |
| maintenance | 300 |
| wash | 200 |
| donate | 0 |
| dispose | 0 |

**GET** `/api/service/estimation-defaults` returns this map for client UI.

---

## Status vs tracking

### `status` (user-facing lifecycle)

`pending` → `pickup_assigned` → `in_service` → `completed` (+ `cancelled`)

### `trackingState` (detailed workflow)

| State | Typical meaning |
|-------|-----------------|
| `request_created` | Just created |
| `pickup_scheduled` | Pickup planned |
| `item_picked` | Picked up from customer |
| `dark_store_received` | At dark store |
| `inspection_started` | Inspection |
| `repair_in_progress` | Work in progress |
| `repair_completed` | Work done |
| `dispatch_ready` | Ready to ship back |
| `out_for_delivery` | Returning to customer |
| `delivered` | Completed delivery |
| `cancelled` | Cancelled |

`update-status` enforces **forward-only** transitions on `trackingState` (no backward moves).

### Actual cost approval

When cobbler sets `actualCost`, `actualCostUserDecision` becomes `pending`. User must **accept** or **reject** before certain ops (assign delivery, assign dark store, forward status). Reject → request `cancelled`.

---

## All APIs — by role

### USER

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/service/my` | List own requests |
| GET | `/api/service/estimation-defaults` | Default costs by type |
| POST | `/api/service/create` | Create request |
| POST | `/api/service/upload-proof/image` | Pre-create proof image URL |
| POST | `/api/service/upload-proof/video` | Pre-create proof video URL |
| PUT | `/api/service/cancel/:requestId` | Cancel own request |
| POST | `/api/service/respond-actual-cost` | Accept/reject final cost |
| GET | `/api/service/:requestId` | Request details (+ article, pickup address) |

### COBBER

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/service/cobbler/new-requests` | Pending, unassigned, not declined by this cobbler |
| GET | `/api/service/cobbler/active` | Assigned to this cobbler, not completed/cancelled |
| POST | `/api/service/cobbler/accept` | Assign self (verified cobbler only) |
| POST | `/api/service/cobbler/reject` | Decline (stays available for others) |
| POST | `/api/service/cobbler/set-actual-cost` | Set `actualCost`, user decision `pending` |
| POST | `/api/service/assign-delivery` | With ADMIN |
| POST | `/api/service/assign-darkstore` | With ADMIN |
| POST | `/api/service/update-status` | With ADMIN |
| POST | `/api/service/upload-media` | With ADMIN, DELIVERY |
| GET | `/api/service/:requestId` | With USER, ADMIN |

### ADMIN

Same as cobbler for assign/update/cancel (broader cancel query). Plus mobile admin profile APIs under Module 2.

### DELIVERY

`POST /api/service/upload-media` only (evidence during delivery).

---

## 1. Create service request

**POST** `/api/service/create`  
**Role:** USER

**Request:**
```json
{
  "articleId": "664a1b2c3d4e5f6a7b8c9d10",
  "serviceType": "repair",
  "addressId": "664a1b2c3d4e5f6a7b8c9d11",
  "photos": ["https://res.cloudinary.com/.../proof.jpg"],
  "videos": [],
  "estimatedCost": 1000,
  "problemDescription": "Sole is separating",
  "pickupMode": "home_pickup",
  "requestedPickupAt": "2025-05-17T10:30:00.000Z",
  "maintenancePlanId": "3m",
  "maintenancePlanLabel": "3 months"
}
```

**Validation:**
- `articleId`, `addressId`: valid Mongo IDs
- `serviceType`: enum above
- `pickupMode`: `home_pickup` | `cobbler_nearby` (default `home_pickup`)
- `problemDescription`: max 2000 chars
- `photos` / `videos`: optional URL string arrays

**Checks:**
- Article must belong to user
- `addressId` must exist in user's `UserProfile.addresses`

**Response (201):**
```json
{
  "success": true,
  "message": "Service request created successfully",
  "data": {
    "request": {
      "_id": "...",
      "status": "pending",
      "trackingState": "request_created",
      "routingType": "dark_store",
      "lifecycleEvents": [ { "state": "request_created", ... } ]
    }
  }
}
```

---

## 2. Get my service requests

**GET** `/api/service/my`  
**Role:** USER

**Response:** `{ "data": { "requests": [ ... ] } }` sorted by `createdAt` desc.

---

## 3. Get estimation defaults

**GET** `/api/service/estimation-defaults`  
**Role:** USER

**Response:**
```json
{
  "success": true,
  "message": "Estimation defaults by service type",
  "data": {
    "estimationDefaults": {
      "repair": 500,
      "maintenance": 300,
      "wash": 200,
      "donate": 0,
      "dispose": 0
    }
  }
}
```

---

## 4. Upload proof (before create)

**POST** `/api/service/upload-proof/image`  
**POST** `/api/service/upload-proof/video`  
**Role:** USER  
**Body:** multipart `file`

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://res.cloudinary.com/...",
    "mediaType": "image"
  }
}
```

Folder: `getmypair/service-requests/proof`. Pass returned `url` in `photos` / `videos` on create.

---

## 5. Get service request details

**GET** `/api/service/:requestId`  
**Role:** USER (own only), COBBER, ADMIN

**Response (200):**
```json
{
  "success": true,
  "data": {
    "request": { ... },
    "article": { "brand", "model", ... },
    "user": { "name", "mobile" },
    "pickupAddress": { "addressLine1", "city", ... },
    "media": { "photos": [], "videos": [] }
  }
}
```

---

## 6. Cancel service request

**PUT** `/api/service/cancel/:requestId`  
**Role:** USER (own), ADMIN, COBBER

Sets `status` and `trackingState` to `cancelled`, appends lifecycle event.

---

## 7. Respond to actual cost

**POST** `/api/service/respond-actual-cost`  
**Role:** USER

**Request:**
```json
{
  "requestId": "...",
  "decision": "accept"
}
```

`decision`: `accept` | `reject`

- **accept:** `actualCostUserDecision` → `accepted`, workflow may continue
- **reject:** request cancelled, decision `rejected`

---

## 8. Assign delivery partner

**POST** `/api/service/assign-delivery`  
**Role:** ADMIN, COBBER

**Request:**
```json
{
  "requestId": "...",
  "deliveryPartnerId": "optional Mongo user id"
}
```

If `deliveryPartnerId` omitted, picks first **verified** delivery profile. Sets status `pickup_assigned`. Blocked while `actualCostUserDecision === 'pending'`.

---

## 9. Assign dark store

**POST** `/api/service/assign-darkstore`  
**Role:** ADMIN, COBBER

**Request:**
```json
{
  "requestId": "...",
  "darkStoreId": "DS-001",
  "darkStoreName": "Central Hub",
  "routingType": "dark_store"
}
```

---

## 10. Update service status

**POST** `/api/service/update-status`  
**Role:** ADMIN, COBBER

**Request:**
```json
{
  "requestId": "...",
  "status": "in_service",
  "state": "repair_in_progress",
  "note": "Started sole repair",
  "cobblerId": "optional assign verified cobbler",
  "photos": [],
  "videos": [],
  "actorType": "cobbler"
}
```

**Guards:**
- No backward `trackingState`
- Inspection/repair states require `cobblerId` on request
- `dark_store_received` requires `darkStoreId`
- Blocked if pending actual-cost approval

Appends to `lifecycleEvents`.

---

## 11. Upload service media (post-create)

**POST** `/api/service/upload-media`  
**Role:** ADMIN, COBBER, DELIVERY

**Body:** `requestId`, optional `photos[]`, `videos[]`, `state`, `note`, `actorType`

Merges URLs into request and logs lifecycle event.

---

## Cobbler job APIs

### List new requests

**GET** `/api/service/cobbler/new-requests`  
Pending, `cobblerId` null, cobbler not in `cobblerDeclinedBy`.

### List active requests

**GET** `/api/service/cobbler/active`  
Assigned to caller, status not `completed` or `cancelled`.

### Accept

**POST** `/api/service/cobbler/accept`  
**Body:** `{ "requestId" }` — verified cobbler only.

### Reject

**POST** `/api/service/cobbler/reject`  
**Body:** `{ "requestId", "reason?" }` — adds cobbler to `cobblerDeclinedBy`; request stays pending for others.

### Set actual cost

**POST** `/api/service/cobbler/set-actual-cost`  
**Body:** `{ "requestId", "actualCost" }` — must be assigned cobbler; sets `actualCostUserDecision: "pending"`.

---

## ServiceRequest model (summary)

Key fields: `userId`, `articleId`, `serviceType`, `addressId`, `problemDescription`, `pickupMode`, `requestedPickupAt`, `maintenancePlanId/Label`, `deliveryPartnerId`, `cobblerId`, `darkStoreId`, `routingType`, `trackingState`, `status`, `estimatedCost`, `actualCost`, `actualCostUserDecision`, `photos`, `videos`, `lifecycleEvents`, `cobblerDeclinedBy`.

---

## Sys-admin (related)

Master admin can list/patch/delete requests under `/api/sys-admin/service-requests` — see [ADMIN_DASHBOARD.md](ADMIN_DASHBOARD.md).

---

## Client documentation

- User app: `getmypair-mobile/gmp/docs/MODULE_4_SERVICE_REQUESTS.md`
- Endpoint index: [API-CATALOG.md](API-CATALOG.md)

---

## Backend files

| File | Role |
|------|------|
| `service.routes.js` | Routes + role middleware |
| `service.controller.js` | All handlers |
| `service.validation.js` | express-validator |
| `serviceRequest.model.js` | Schema + enums |
| `docs/service.paths.js` | Swagger |

---

**End of Module 4 Documentation**
