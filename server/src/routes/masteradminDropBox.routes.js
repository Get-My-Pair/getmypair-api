const express = require('express');
const adminMasterAuth = require('../middleware/adminMasterAuth.middleware');
const controller = require('../controllers/masteradminDropBox.controller');

const router = express.Router();

/**
 * Masteradmin Drop Box (mounted at /api/masteradmin).
 * Needs the same masteradmin token the dashboard gets at login.
 */
router.get('/dropbox-requests', adminMasterAuth, controller.listRequests);
router.delete('/dropbox-requests/:id', adminMasterAuth, controller.deleteRequest);

module.exports = router;
