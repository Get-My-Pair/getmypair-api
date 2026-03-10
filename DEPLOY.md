# Deploy GetMyPair API (e.g. Render)

- **Root directory:** Use `server` as the project root (so `package.json` and `src/` are at the root of the build).
- **Build:** `npm install`
- **Start:** `npm start` (runs `node src/server.js`)

If the Flutter app gets **404 "Route not found"** on `GET /api/cobbler/home/dashboard`, the deployed service is likely running an **old build**. Redeploy the latest code so that the cobbler home routes (`/api/cobbler/home/*`) are included.
