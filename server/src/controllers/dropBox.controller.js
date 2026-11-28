const crypto = require('crypto');
const { success, error: errorResponse, notFound } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');
const { cleanSubmission, cleanLocation } = require('../utils/dropBoxValidation');
const geocodeService = require('../services/geocode.service');
const DropBoxRequest = require('../models/dropBoxRequest.model');

const OBJECT_ID_RE = /^[a-f\d]{24}$/i;
const ADDRESS_LOOKUP_TIMEOUT_MS = 5000;

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

function tokenMatches(token, storedHash) {
  if (typeof token !== 'string' || !token || !storedHash) return false;
  const a = Buffer.from(hashToken(token));
  const b = Buffer.from(storedHash);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('Address lookup timed out')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Best-effort "lat/lng → street address" so the masteradmin sees a readable place.
 * Runs after the response is sent; a failure just leaves the address empty.
 */
async function attachAddress(id, lat, lng) {
  try {
    const place = await withTimeout(geocodeService.reverseGeocode(lat, lng), ADDRESS_LOOKUP_TIMEOUT_MS);
    const address = String(place?.displayName || '').slice(0, 400);
    if (!address) return;
    // Only write if the visitor hasn't re-shared a different spot in the meantime.
    await DropBoxRequest.updateOne(
      { _id: id, 'location.lat': lat, 'location.lng': lng },
      { $set: { 'location.address': address } }
    );
  } catch (err) {
    logger.warn(`Drop box address lookup failed for ${id}: ${err.message}`);
  }
}

/** POST /api/dropbox/requests — public */
const createRequest = asyncHandler(async (req, res) => {
  const { value, error } = cleanSubmission(req.body);
  if (error) return errorResponse(res, error, 400);

  const locationToken = crypto.randomBytes(24).toString('hex');
  const row = await DropBoxRequest.create({
    ...value,
    locationTokenHash: hashToken(locationToken),
  });

  return success(
    res,
    'Drop box request received',
    {
      item: { id: String(row._id), name: row.name, phone: row.phone, createdAt: row.createdAt },
      // Shown once; the thank-you page uses it to attach the visitor's location.
      locationToken,
    },
    201
  );
});

/** PATCH /api/dropbox/requests/:id/location — public, needs the token from createRequest */
const saveLocation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!OBJECT_ID_RE.test(id)) return notFound(res, 'Request not found');

  const row = await DropBoxRequest.findById(id).select('+locationTokenHash');
  const token = req.body?.token ?? req.get('x-dropbox-token');
  // Same answer for "no such request" and "wrong token" so ids can't be probed.
  if (!row || !tokenMatches(token, row.locationTokenHash)) {
    return notFound(res, 'Request not found');
  }

  const { value, error } = cleanLocation(req.body);
  if (error) return errorResponse(res, error, 400);

  if (value.denied) {
    // Never downgrade a location that was already shared.
    if (row.locationStatus === 'pending') {
      row.locationStatus = 'denied';
      await row.save();
    }
    return success(res, 'Location choice saved', {
      locationStatus: row.locationStatus,
      location: row.locationPublic(),
    });
  }

  row.locationStatus = 'shared';
  row.location = {
    lat: value.lat,
    lng: value.lng,
    accuracy: value.accuracy ?? undefined,
    address: '',
    capturedAt: new Date(),
  };
  await row.save();

  success(res, 'Location saved', {
    locationStatus: row.locationStatus,
    location: row.locationPublic(),
  });

  attachAddress(row._id, value.lat, value.lng);
});

module.exports = {
  createRequest,
  saveLocation,
};
