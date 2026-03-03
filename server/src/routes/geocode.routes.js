/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : geocode.routes.js
 * Description: Geocode route – reverse lookup (lat/lng to address)
 * ----------------------------------------------------------------------------
 * Developer  : C Ranjith Kumar
 * Role       : Backend and Database Developer, Team Lead
 * ----------------------------------------------------------------------------
 * LinkedIn         : https://www.linkedin.com/in/coding-ranjith/
 * Personal GitHub  : https://github.com/CodingRanjith
 * Project GitHub   : https://github.com/Ranjithgmp
 * Personal Email   : ranjith.c96me@gmail.com
 * Project Email    : ranjith.kumar@getmypair.com
 * ----------------------------------------------------------------------------
 * Last modified : 2025-03-03
 * ----------------------------------------------------------------------------
 */

const express = require('express');
const router = express.Router();
const geocodeController = require('../controllers/geocode.controller');

/**
 * Public reverse geocode endpoint
 * GET /api/geocode/reverse?lat=..&lon=..
 */
router.get('/reverse', geocodeController.reverse);

module.exports = router;

