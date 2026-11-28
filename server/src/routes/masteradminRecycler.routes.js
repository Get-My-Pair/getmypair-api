const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const controller = require('../controllers/masteradminRecycler.controller');

const router = express.Router();

/**
 * Masteradmin recycler management (mounted at /api/masteradmin).
 * Every route requires a logged-in user with role `admin`.
 */
const adminOnly = [authMiddleware, roleMiddleware(['admin'])];

router.get('/recyclers', adminOnly, controller.listRecyclers);
router.post('/recyclers', adminOnly, controller.createRecycler);
router.patch('/recyclers/:id', adminOnly, controller.updateRecycler);
router.delete('/recyclers/:id', adminOnly, controller.deleteRecycler);

router.get('/recycler-requests', adminOnly, controller.listRequests);
router.patch('/recycler-requests/:id/allocate', adminOnly, controller.allocateRequest);
router.delete('/recycler-requests/:id', adminOnly, controller.deleteRequest);

module.exports = router;
