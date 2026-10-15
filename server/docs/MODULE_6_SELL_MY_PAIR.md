# Module 6 — Sell My Pair

Luxury / everyday footwear listings submitted by the **User** app for **Masteradmin** review.

| Layer | Path |
|-------|------|
| Routes (user) | `server/src/routes/sell.routes.js` → mount `/api/sell` |
| Routes (admin) | `server/src/routes/masteradmin.routes.js` → `/api/masteradmin/sell-listings` |
| Controller | `server/src/controllers/sellListing.controller.js` |
| Model | `server/src/models/sellListing.model.js` |
| Validation | `server/src/validations/sellListing.validation.js` |

---

## Status flow

```
User submits → status: pending (In review)
                    ↓
         Masteradmin Approve → approved
         Masteradmin Reject  → rejected (+ rejectReason)
```

Mobile My Rack shows:

| Status | Meaning |
|--------|---------|
| `pending` | In review |
| `approved` | Approved |
| `rejected` | Rejected (user can resubmit a new listing) |

---

## User APIs (`/api/sell`)

**Auth:** Bearer JWT + role `USER` on all routes.

### 1. Upload authenticity proof

**POST** `/api/sell/upload-proof`  
**Content-Type:** `multipart/form-data`

| Field | Required | Notes |
|-------|----------|--------|
| `file` | yes | Image (multer / Cloudinary) |
| `proofType` | yes | One of: `receipt`, `purchaseEmail`, `authenticityCard`, `boxLabel` |

**Response (200):**
```json
{
  "success": true,
  "message": "Proof uploaded",
  "data": {
    "imageUrl": "https://res.cloudinary.com/...",
    "proofType": "receipt"
  }
}
```

### 2. Create listing

**POST** `/api/sell/listings`  
**Content-Type:** `application/json`

```json
{
  "articleId": "64f...",
  "footwearType": "luxury",
  "originalRetailPrice": 12000,
  "conditionGrade": "like_new",
  "proofs": {
    "receipt": "https://...",
    "purchaseEmail": "https://...",
    "authenticityCard": "https://...",
    "boxLabel": "https://..."
  },
  "basePrice": 8000,
  "auctionStartDate": "2026-10-20T00:00:00.000Z",
  "auctionEndDate": "2026-10-27T00:00:00.000Z"
}
```

| Field | Rules |
|-------|--------|
| `articleId` | Must belong to the authenticated user |
| `footwearType` | `luxury` \| `everyday` — must match the article’s `footwearType` |
| `conditionGrade` | `brand_new_in_box` \| `like_new` \| `gently_used` |
| `proofs` | All four proof URLs required |
| `basePrice` / `originalRetailPrice` | Positive numbers |
| Dates | `auctionEndDate` after `auctionStartDate` |

**Response (201):** `{ listing: { ...status: "pending", article, ... } }`

### 3. List my listings

**GET** `/api/sell/listings`  
**Query (optional):** `footwearType=luxury` \| `everyday`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "listings": [
      {
        "_id": "...",
        "footwearType": "luxury",
        "status": "pending",
        "rejectReason": null,
        "basePrice": 8000,
        "article": { "brand": "...", "model": "...", "images": [] },
        "owner": { "name": "...", "mobile": "..." }
      }
    ]
  }
}
```

---

## Masteradmin APIs

**Auth:** Masteradmin JWT (`adminMasterAuth`).  
**Base:** `/api/masteradmin` (alias `/api/sys-admin`).

| Method | Path | Description |
|--------|------|-------------|
| GET | `/sell-listings` | List all (query: `status`, `footwearType`) |
| GET | `/sell-listings/:id` | Detail |
| PATCH | `/sell-listings/:id/review` | Approve or reject |

### Review body

```json
{
  "status": "approved"
}
```

or

```json
{
  "status": "rejected",
  "rejectReason": "Proof of purchase unclear"
}
```

- `status` required: `approved` \| `rejected`
- `rejectReason` required when rejecting (max 500 chars)
- Only **pending** listings can be reviewed; after that, admin UI is view-only

Frontend: `client/client` → Masteradmin → Sell My Pair review page.

---

## Data model (summary)

`SellListing`:

- `ownerId`, `articleId`
- `footwearType`: `luxury` \| `everyday`
- `originalRetailPrice`, `conditionGrade`, `proofs`, `basePrice`
- `auctionStartDate`, `auctionEndDate`
- `status`: `pending` \| `approved` \| `rejected`
- `rejectReason`, `reviewedBy`, `reviewedAt`

---

## Related

- Articles: [MODULE_3_DOCUMENTATION.md](MODULE_3_DOCUMENTATION.md) (`footwearType` on article)
- Admin portals: [ADMIN_DASHBOARD.md](ADMIN_DASHBOARD.md)
- Endpoint index: [API-CATALOG.md](API-CATALOG.md)
