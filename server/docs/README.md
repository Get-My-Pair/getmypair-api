# GetMyPair API — Backend Documentation

This folder contains **module documentation** for the GetMyPair backend API (`getmypair-api/server`).

## Module 1: Authentication & Health

**[MODULE_1_DOCUMENTATION.md](MODULE_1_DOCUMENTATION.md)**

- Health & version: `GET /health`, `GET /api/version`
- Auth: send-otp, verify-otp, complete-profile, refresh-token, logout, me
- Validation, response format, security, backend file references

## Module 2: Profile & Geocode

**[MODULE_2_DOCUMENTATION.md](MODULE_2_DOCUMENTATION.md)**

- **User profile** (role USER): create, me, update, upload-image, address add/update/delete
- **Cobbler profile** (role COBBER): create, me, update, shop, services, tools, upload-image, upload-doc, verification
- **Delivery profile** (role DELIVERY): create, me, update, vehicle, upload-doc, upload-image, verification
- **Admin profile** (role ADMIN): users, cobblers, delivery, get by id, verify, status
- **Geocode** (public): reverse lat/lon → location

---

*Swagger/OpenAPI path definitions live in `server/src/docs/*.paths.js` and are served at `/api-docs`.*
