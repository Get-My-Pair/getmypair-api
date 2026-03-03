/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : geocode.controller.js
 * Description: Geocode – reverse lookup (lat/lng to address)
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

const { success, error: errorResponse } = require('../utils/response');
const geocodeService = require('../services/geocode.service');
const logger = require('../utils/logger');

/**
 * GET /api/geocode/reverse?lat=..&lon=..
 */
const reverse = async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (lat === undefined || lon === undefined) {
      return errorResponse(res, 'lat and lon are required', 400);
    }

    const location = await geocodeService.reverseGeocode(lat, lon);
    return success(res, 'Location retrieved successfully', { location });
  } catch (err) {
    logger.error(`Geocode reverse error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

module.exports = {
  reverse,
};

