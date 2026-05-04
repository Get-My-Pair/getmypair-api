const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const cobblerProfileController = require('../controllers/cobblerProfile.controller');

const router = express.Router();

// Any authenticated account may query nearby cobblers (still requires valid Bearer token).
router.get(
  '/nearby',
  authMiddleware,
  roleMiddleware(['user', 'customer', 'cobbler', 'admin', 'moderator']),
  cobblerProfileController.getNearby
);

module.exports = router;
