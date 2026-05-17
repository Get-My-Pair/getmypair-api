# Module 3 — Articles (Digital Shoe Passport) APIs

## Overview

Module 3 manages **articles** — registered shoes tied to a customer (`ownerId`). Used by the user mobile app **My Rack**. All routes require **JWT** and role **`USER`**.

| Layer | Path |
|-------|------|
| Routes | `server/src/routes/article.routes.js` |
| Controller | `server/src/controllers/article.controller.js` |
| Validation | `server/src/validations/article.validation.js` |
| Model | `server/src/models/article.model.js` |
| Mount | `app.use('/api/articles', articleRoutes)` |

---

## All APIs (Module 3)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/articles/create` | USER | Register a new shoe |
| GET | `/api/articles/my` | USER | List own articles (newest first) |
| GET | `/api/articles/:articleId` | USER | Get one article (owner only) |
| PUT | `/api/articles/update/:articleId` | USER | Partial update |
| DELETE | `/api/articles/delete/:articleId` | USER | Delete + remove Cloudinary images |
| POST | `/api/articles/upload-image` | USER | Multipart image → append URL to article |

---

## Data model (`Article`)

| Field | Type | Notes |
|-------|------|--------|
| `ownerId` | ObjectId → User | Required, indexed |
| `brand`, `model` | String | Required, max 120 |
| `category` | enum | `sports_shoe`, `casual`, `formal`, `sandal`, `boot`, `slipper`, `other` |
| `color` | String | Optional, max 60 |
| `purchaseYear` | Number | 1900–2100; cannot be future year |
| `materials` | `[{ type, percentage }]` | percentage 0–100 |
| `condition` | enum | `excellent`, `good`, `fair`, `worn` (default `good`) |
| `images` | `[String]` | Cloudinary HTTPS URLs |
| `createdAt`, `updatedAt` | timestamps | |

**Indexes:** `{ ownerId: 1, createdAt: -1 }`

**Business rules (controller):**
- Rejects duplicate shoes for same owner (same brand, model, category, color, purchaseYear, condition)
- On delete, attempts Cloudinary cleanup for each image URL

---

## 1. Create article

**POST** `/api/articles/create`

**Request:**
```json
{
  "brand": "Nike",
  "model": "Air Max 90",
  "category": "sports_shoe",
  "color": "White/Black",
  "purchaseYear": 2022,
  "condition": "good",
  "materials": [
    { "type": "Leather", "percentage": 40 },
    { "type": "Mesh", "percentage": 60 }
  ],
  "images": []
}
```

**Validation highlights:**
- `purchaseYear` **required** on create (integer 1900–2100)
- `brand`, `model`, `category` required
- `materials`, `images` optional arrays; image entries must be valid URLs if provided

**Response (201):**
```json
{
  "success": true,
  "message": "Article created successfully",
  "data": {
    "article": { "_id": "...", "ownerId": "...", ... }
  }
}
```

**Errors:** 401-style message if duplicate; 500 on server error.

---

## 2. Get my articles

**GET** `/api/articles/my`

**Response (200):**
```json
{
  "success": true,
  "message": "Articles retrieved successfully",
  "data": {
    "articles": [ { ... }, { ... } ]
  }
}
```

---

## 3. Get article by ID

**GET** `/api/articles/:articleId`

**Params:** `articleId` — MongoDB ObjectId

**Response (200):** `{ "data": { "article": { ... } } }`  
**404:** Not found or not owned by caller

---

## 4. Update article

**PUT** `/api/articles/update/:articleId`

**Body:** Any subset of `brand`, `model`, `category`, `color`, `purchaseYear`, `condition`, `materials`, `images`. At least one field required.

**Response (200):** `{ "data": { "article": { ... } } }`

---

## 5. Delete article

**DELETE** `/api/articles/delete/:articleId`

**Response (200):**
```json
{
  "success": true,
  "message": "Article deleted successfully",
  "data": { "articleId": "..." }
}
```

---

## 6. Upload article image

**POST** `/api/articles/upload-image`  
**Content-Type:** `multipart/form-data`

| Field | Location | Required |
|-------|----------|----------|
| `file` | multipart | Yes (image) |
| `articleId` | body or query | Yes |

**Behavior:**
- Uploads to Cloudinary folder `getmypair/articles`
- Appends `secure_url` to `article.images`
- Max size / types enforced in `upload.middleware.js` (JPEG, PNG, WEBP; typically 5MB)

**Response (200):**
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "imageUrl": "https://res.cloudinary.com/...",
    "articleId": "...",
    "images": ["..."]
  }
}
```

---

## Integration

| Consumer | Usage |
|----------|--------|
| Module 4 | `POST /api/service/create` requires valid `articleId` owned by user |
| Sys-admin | `GET /api/sys-admin/articles`, `.../articles/by-owner` |
| Mobile | `getmypair-mobile/gmp/docs/MODULE_3_ARTICLES.md` |

---

## Backend files

| File | Role |
|------|------|
| `article.routes.js` | Route wiring + `roleMiddleware(['USER'])` |
| `article.controller.js` | CRUD + upload |
| `article.validation.js` | express-validator rules |
| `article.model.js` | Mongoose schema |
| `config/cloudinary.js` | Upload/delete helpers |
| `docs/article.paths.js` | Swagger definitions |

---

**End of Module 3 Documentation**
