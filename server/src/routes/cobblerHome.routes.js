/**
 * Cobbler Home routes – dashboard
 */
const express = require('express');
const router = express.Router();
const cobblerHomeController = require('../controllers/cobblerHome.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

router.get(
    '/dashboard',
    authMiddleware,
    roleMiddleware(['COBBER']),
    cobblerHomeController.getDashboard
);

module.exports = router;
