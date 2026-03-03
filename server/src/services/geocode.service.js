/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : geocode.service.js
 * Description: Geocode service – reverse lookup (lat/lng to address) via Nominatim
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

const config = require('../config/env');
const logger = require('../utils/logger');

// Try to use global fetch (Node 18+). Fallback to node-fetch if available.
let fetchFn = global.fetch;
if (!fetchFn) {
  try {
    // eslint-disable-next-line import/no-extraneous-dependencies
    fetchFn = require('node-fetch');
  } catch (err) {
    fetchFn = null;
  }
}

async function reverseGeocode(lat, lon) {
  if (lat === undefined || lon === undefined) {
    throw new Error('lat and lon are required');
  }

  const latNum = Number(lat);
  const lonNum = Number(lon);
  if (Number.isNaN(latNum) || Number.isNaN(lonNum)) {
    throw new Error('lat and lon must be valid numbers');
  }

  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
    latNum,
  )}&lon=${encodeURIComponent(lonNum)}&addressdetails=1`;

  if (!fetchFn) {
    throw new Error('Fetch API not available. Install node-fetch or run on Node 18+');
  }

  try {
    const res = await fetchFn(url, {
      headers: {
        'User-Agent': 'getmypair-server/1.0 (contact@getmypair.example)',
      },
    });

    if (!res.ok) {
      const text = await res.text();
      logger.error(`Geocode provider responded ${res.status}: ${text}`);
      throw new Error('Geocoding provider error');
    }

    const data = await res.json();

    const address = data.address || {};
    const location = {
      displayName: data.display_name || null,
      houseNumber: address.house_number || null,
      road: address.road || null,
      neighbourhood: address.neighbourhood || null,
      suburb: address.suburb || null,
      city:
        address.city || address.town || address.village || address.hamlet || null,
      county: address.county || null,
      state: address.state || null,
      postcode: address.postcode || null,
      country: address.country || null,
      countryCode: address.country_code || null,
      lat: data.lat || latNum,
      lon: data.lon || lonNum,
      raw: data,
    };

    return location;
  } catch (err) {
    logger.error(`reverseGeocode error: ${err.message}`);
    throw err;
  }
}

module.exports = {
  reverseGeocode,
};

