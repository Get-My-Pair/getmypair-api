const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const cobblerProfileController = require('../controllers/cobblerProfile.controller');

const router = express.Router();

// Mobile customer app registers users as role `user`; some deployments use `customer`.
// Cobblers must not use this discovery list (see SelectLocationPage 403 handling).
router.get(
  '/nearby',
  authMiddleware,
  roleMiddleware(['user', 'customer']),
  cobblerProfileController.getNearby
);

module.exports = router;
