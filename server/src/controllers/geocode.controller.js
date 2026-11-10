/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : geocode.controller.js
 * Description: Geocode – reverse lookup (lat/lng to address)
 * ----------------------------------------------------------------------------
 * Developer  : C Ranjith Kumar
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

/**
 * GET /api/geocode/forward?q=address
 */
const forward = async (req, res) => {
  try {
    const q = String(req.query.q || req.query.address || '').trim();
    if (!q) return errorResponse(res, 'q (address) is required', 400);
    const location = await geocodeService.forwardGeocode(q);
    return success(res, 'Coordinates retrieved successfully', { location });
  } catch (err) {
    logger.error(`Geocode forward error: ${err.message}`);
    const status = /No coordinates|fuller address/i.test(err.message) ? 404 : 500;
    return errorResponse(res, err.message, status);
  }
};

/**
 * GET /api/geocode/route?fromLat=&fromLng=&toLat=&toLng=
 * Driving road distance + ETA (Google Directions or OSRM fallback).
 */
const route = async (req, res) => {
  try {
    const { fromLat, fromLng, toLat, toLng } = req.query;
    if ([fromLat, fromLng, toLat, toLng].some((v) => v === undefined || v === '')) {
      return errorResponse(res, 'fromLat, fromLng, toLat, toLng are required', 400);
    }
    const routeInfo = await geocodeService.routeDistance(fromLat, fromLng, toLat, toLng);
    return success(res, 'Route retrieved successfully', { route: routeInfo });
  } catch (err) {
    logger.error(`Geocode route error: ${err.message}`);
    const status = /out of range|valid numbers|required/i.test(err.message) ? 400 : 502;
    return errorResponse(res, err.message, status);
  }
};

module.exports = {
  reverse,
  forward,
  route,
};

