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

