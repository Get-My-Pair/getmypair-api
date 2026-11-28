const express = require('express');
const adminMasterAuth = require('../middleware/adminMasterAuth.middleware');
const controller = require('../controllers/masteradminRecycler.controller');

const router = express.Router();

/**
 * Masteradmin recycler management (mounted at /api/masteradmin).
 * Needs the same masteradmin token the dashboard gets at login.
 */
router.get('/recyclers', adminMasterAuth, controller.listRecyclers);
router.post('/recyclers', adminMasterAuth, controller.createRecycler);
router.patch('/recyclers/:id', adminMasterAuth, controller.updateRecycler);
router.delete('/recyclers/:id', adminMasterAuth, controller.deleteRecycler);

router.get('/recycler-requests', adminMasterAuth, controller.listRequests);
router.patch('/recycler-requests/:id/allocate', adminMasterAuth, controller.allocateRequest);
router.delete('/recycler-requests/:id', adminMasterAuth, controller.deleteRequest);

module.exports = router;
