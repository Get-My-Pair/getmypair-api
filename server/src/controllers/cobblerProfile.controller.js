const { success, error: errorResponse } = require('../utils/response');

/**
 * GET /api/cobbler/profile/nearby
 * Customer discovery: list cobblers within radius (placeholder until Cobbler store exists).
 */
const getNearby = async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const radiusKm = parseFloat(req.query.radiusKm);

    if (Number.isNaN(lat) || Number.isNaN(lng) || Number.isNaN(radiusKm)) {
      return errorResponse(res, 'Invalid lat, lng, or radiusKm query parameters', 400);
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return errorResponse(res, 'Coordinates out of range', 400);
    }
    if (radiusKm <= 0 || radiusKm > 500) {
      return errorResponse(res, 'radiusKm must be greater than 0 and at most 500', 400);
    }

    // When a Cobbler model / geo index exists, filter by distance here.
    return success(res, 'Nearby cobblers retrieved', {
      cobblers: [],
      lat,
      lng,
      radiusKm,
    });
  } catch (err) {
    return errorResponse(res, err.message || 'Failed to load nearby cobblers', 500);
  }
};

module.exports = {
  getNearby,
};
