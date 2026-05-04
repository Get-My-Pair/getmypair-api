const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const cobblerProfileController = require('../controllers/cobblerProfile.controller');

const router = express.Router();

// Discovery list: any valid session may call (no role gate — avoids 403 when DB role
// labels differ from the app, e.g. legacy values or deploy drift vs this repo).
router.get('/nearby', authMiddleware, cobblerProfileController.getNearby);

module.exports = router;
