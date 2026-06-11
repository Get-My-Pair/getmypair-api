/**
 * Customer in-app notification routes.
 */
const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const userNotificationController = require('../controllers/userNotification.controller');

router.use(authMiddleware);
router.use(roleMiddleware(['USER']));

router.get('/', userNotificationController.listNotifications);
router.patch('/:id/read', userNotificationController.markNotificationRead);

module.exports = router;
