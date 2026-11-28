const express = require('express');
const controller = require('../controllers/dropBox.controller');
const { dropBoxSubmitRateLimiter, dropBoxLocationRateLimiter } = require('../middleware/rateLimit');

const router = express.Router();

/**
 * Public Drop Box API (mounted at /api/dropbox) — no login.
 *   POST  /requests               submit photo + name + phone; returns a one-time locationToken
 *   PATCH /requests/:id/location  attach the visitor's location (body: token + lat/lng, or denied)
 */
router.post('/requests', dropBoxSubmitRateLimiter, controller.createRequest);
router.patch('/requests/:id/location', dropBoxLocationRateLimiter, controller.saveLocation);

module.exports = router;
