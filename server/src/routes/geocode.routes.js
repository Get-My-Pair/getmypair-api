const express = require('express');
const router = express.Router();
const geocodeController = require('../controllers/geocode.controller');

/**
 * Public reverse geocode endpoint
 * GET /api/geocode/reverse?lat=..&lon=..
 */
router.get('/reverse', geocodeController.reverse);

module.exports = router;

