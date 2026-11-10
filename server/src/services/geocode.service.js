/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : geocode.service.js
 * Description: Geocode service – reverse lookup (lat/lng to address) via Nominatim
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

async function nominatimFetch(url) {
  if (!fetchFn) {
    throw new Error('Fetch API not available. Install node-fetch or run on Node 18+');
  }
  const res = await fetchFn(url, {
    headers: {
      'User-Agent': 'getmypair-server/1.0 (contact@getmypair.example)',
      Accept: 'application/json',
    },
  });
  if (!res.ok) {
    const text = await res.text();
    logger.error(`Geocode provider responded ${res.status}: ${text}`);
    throw new Error('Geocoding provider error');
  }
  return res.json();
}

async function forwardGeocode(query, { countrycodes = 'in' } = {}) {
  const q = String(query || '').trim();
  if (!q || q.length < 5) {
    throw new Error('Enter a fuller address to look up coordinates');
  }

  const params = new URLSearchParams({
    format: 'jsonv2',
    q,
    limit: '1',
    addressdetails: '1',
  });
  if (countrycodes) params.set('countrycodes', countrycodes);

  const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;

  try {
    const data = await nominatimFetch(url);
    const hit = Array.isArray(data) ? data[0] : null;
    if (!hit) {
      throw new Error('No coordinates found for that address');
    }
    const address = hit.address || {};
    return {
      displayName: hit.display_name || null,
      houseNumber: address.house_number || null,
      road: address.road || null,
      neighbourhood: address.neighbourhood || null,
      suburb: address.suburb || null,
      city: address.city || address.town || address.village || address.hamlet || null,
      county: address.county || null,
      state: address.state || null,
      postcode: address.postcode || null,
      country: address.country || null,
      countryCode: address.country_code || null,
      lat: hit.lat != null ? Number(hit.lat) : null,
      lon: hit.lon != null ? Number(hit.lon) : null,
      raw: hit,
    };
  } catch (err) {
    logger.error(`forwardGeocode error: ${err.message}`);
    throw err;
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

  try {
    const data = await nominatimFetch(url);

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

function roundKm(n) {
  if (n == null || !Number.isFinite(Number(n))) return null;
  return Math.round(Number(n) * 10) / 10;
}

function formatDuration(seconds) {
  const s = Math.max(0, Math.round(Number(seconds) || 0));
  if (s < 60) return { seconds: s, minutes: 1, label: '1 min' };
  const minutes = Math.round(s / 60);
  if (minutes < 60) return { seconds: s, minutes, label: `${minutes} min` };
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  const label = rem ? `${hours} hr ${rem} min` : `${hours} hr`;
  return { seconds: s, minutes, hours, label };
}

async function googleDrivingRoute(fromLat, fromLng, toLat, toLng) {
  const key = String(config.GOOGLE_MAPS_API_KEY || '').trim();
  if (!key || !fetchFn) return null;
  const params = new URLSearchParams({
    origin: `${fromLat},${fromLng}`,
    destination: `${toLat},${toLng}`,
    mode: 'driving',
    units: 'metric',
    region: 'in',
    key,
  });
  const url = `https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`;
  const res = await fetchFn(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Directions ${res.status}: ${text.slice(0, 180)}`);
  }
  const data = await res.json();
  if (data.status !== 'OK' || !data.routes?.[0]?.legs?.[0]) {
    throw new Error(data.error_message || `Google Directions status: ${data.status || 'UNKNOWN'}`);
  }
  const leg = data.routes[0].legs[0];
  const meters = Number(leg.distance?.value);
  const seconds = Number(leg.duration?.value);
  const duration = formatDuration(seconds);
  return {
    provider: 'google',
    distanceMeters: meters,
    distanceKm: roundKm(meters / 1000),
    durationSeconds: seconds,
    durationMinutes: duration.minutes,
    durationLabel: duration.label,
    summary: data.routes[0].summary || null,
  };
}

async function osrmDrivingRoute(fromLat, fromLng, toLat, toLng) {
  if (!fetchFn) throw new Error('Fetch API not available');
  const path = `${fromLng},${fromLat};${toLng},${toLat}`;
  const url = `https://router.project-osrm.org/route/v1/driving/${path}?overview=false&alternatives=false&steps=false`;
  const res = await fetchFn(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'getmypair-server/1.0 (contact@getmypair.example)',
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OSRM route ${res.status}: ${text.slice(0, 180)}`);
  }
  const data = await res.json();
  const route = data?.routes?.[0];
  if (!route || data.code !== 'Ok') {
    throw new Error(data?.message || 'No driving route found');
  }
  const meters = Number(route.distance);
  const seconds = Number(route.duration);
  const duration = formatDuration(seconds);
  return {
    provider: 'osrm',
    distanceMeters: meters,
    distanceKm: roundKm(meters / 1000),
    durationSeconds: seconds,
    durationMinutes: duration.minutes,
    durationLabel: duration.label,
    summary: null,
  };
}

/**
 * Road distance + driving ETA between two coordinates.
 * Prefers Google Directions when GOOGLE_MAPS_API_KEY is set; falls back to OSRM.
 */
async function routeDistance(fromLat, fromLng, toLat, toLng) {
  const aLat = Number(fromLat);
  const aLng = Number(fromLng);
  const bLat = Number(toLat);
  const bLng = Number(toLng);
  if (![aLat, aLng, bLat, bLng].every((n) => Number.isFinite(n))) {
    throw new Error('fromLat, fromLng, toLat, toLng must be valid numbers');
  }
  if (Math.abs(aLat) > 90 || Math.abs(bLat) > 90 || Math.abs(aLng) > 180 || Math.abs(bLng) > 180) {
    throw new Error('Coordinates out of range');
  }

  if (config.GOOGLE_MAPS_API_KEY) {
    try {
      return await googleDrivingRoute(aLat, aLng, bLat, bLng);
    } catch (err) {
      logger.warn(`Google route failed, trying OSRM: ${err.message}`);
    }
  }

  return osrmDrivingRoute(aLat, aLng, bLat, bLng);
}

module.exports = {
  reverseGeocode,
  forwardGeocode,
  routeDistance,
  formatDuration,
};

