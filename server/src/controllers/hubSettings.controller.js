/**
 * Hub addresses — Masteradmin multi create/update/delete, Delivery member list for directions.
 */
const mongoose = require('mongoose');
const HubSettings = require('../models/hubSettings.model');
const { success, error: errorResponse, notFound } = require('../utils/response');
const logger = require('../utils/logger');

function formatLine(hub) {
  return [hub.address, hub.city, hub.state, hub.pincode].filter(Boolean).join(', ');
}

function publicHub(hub) {
  if (!hub) return null;
  return {
    _id: String(hub._id),
    id: String(hub._id),
    name: hub.name || '',
    address: hub.address || '',
    city: hub.city || '',
    state: hub.state || '',
    pincode: hub.pincode || '',
    lat: hub.lat == null ? null : Number(hub.lat),
    lng: hub.lng == null ? null : Number(hub.lng),
    notes: hub.notes || '',
    isActive: hub.isActive !== false,
    line: formatLine(hub),
    updatedAt: hub.updatedAt || null,
    createdAt: hub.createdAt || null,
  };
}

function parseCoords(body) {
  let lat = body.lat;
  let lng = body.lng;
  lat = lat === '' || lat == null ? null : Number(lat);
  lng = lng === '' || lng == null ? null : Number(lng);
  if (lat != null && !Number.isFinite(lat)) {
    return { error: 'lat must be a number' };
  }
  if (lng != null && !Number.isFinite(lng)) {
    return { error: 'lng must be a number' };
  }
  return { lat, lng };
}

function pickFields(body = {}) {
  const str = (key) => String(body[key] ?? '').trim();
  const coords = parseCoords(body);
  if (coords.error) return { error: coords.error };
  return {
    name: str('name') || 'GetMyPair Hub',
    address: str('address'),
    city: str('city'),
    state: str('state'),
    pincode: str('pincode'),
    notes: str('notes'),
    lat: coords.lat,
    lng: coords.lng,
  };
}

let droppedLegacyKeyIndex = false;
async function dropLegacySingletonIndex() {
  if (droppedLegacyKeyIndex) return;
  droppedLegacyKeyIndex = true;
  try {
    await HubSettings.collection.dropIndex('key_1');
  } catch (_) {
    // Index may already be gone — ignore.
  }
}

const listHubs = async (req, res) => {
  try {
    await dropLegacySingletonIndex();
    const activeOnly = String(req.query.active || '').trim() === '1';
    const filter = activeOnly ? { isActive: { $ne: false } } : {};
    const items = await HubSettings.find(filter).sort({ createdAt: -1 }).lean();
    const hubs = items.map(publicHub).filter(Boolean);
    return success(res, 'Hub addresses', {
      items: hubs,
      // backward-compatible single hub field (first active)
      hub: hubs.find((h) => h.isActive) || hubs[0] || null,
    });
  } catch (err) {
    logger.error(`List hubs error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

const createHub = async (req, res) => {
  try {
    await dropLegacySingletonIndex();
    const fields = pickFields(req.body);
    if (fields.error) return errorResponse(res, fields.error, 400);
    if (!fields.address) return errorResponse(res, 'Hub street address is required', 400);

    const hub = await HubSettings.create({
      ...fields,
      isActive: req.body.isActive === false || req.body.isActive === 'false' ? false : true,
      updatedBy: req.adminMaster?._id || null,
    });

    return success(res, 'Hub created', { hub: publicHub(hub.toObject()) }, 201);
  } catch (err) {
    logger.error(`Create hub error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

const updateHub = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return errorResponse(res, 'Invalid hub id', 400);

    const fields = pickFields(req.body);
    if (fields.error) return errorResponse(res, fields.error, 400);
    if (!fields.address) return errorResponse(res, 'Hub street address is required', 400);

    const $set = {
      ...fields,
      updatedBy: req.adminMaster?._id || null,
    };
    if (Object.prototype.hasOwnProperty.call(req.body, 'isActive')) {
      $set.isActive = !(req.body.isActive === false || req.body.isActive === 'false');
    }

    const hub = await HubSettings.findByIdAndUpdate(id, { $set }, { new: true }).lean();
    if (!hub) return notFound(res, 'Hub not found');
    return success(res, 'Hub updated', { hub: publicHub(hub) });
  } catch (err) {
    logger.error(`Update hub error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

const deleteHub = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return errorResponse(res, 'Invalid hub id', 400);
    const hub = await HubSettings.findByIdAndDelete(id).lean();
    if (!hub) return notFound(res, 'Hub not found');
    return success(res, 'Hub deleted', { hub: publicHub(hub) });
  } catch (err) {
    logger.error(`Delete hub error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

/** Customer / care-flow: active hubs only (Self Drop off). */
const listActiveHubsForCustomer = async (req, res) => {
  req.query = { ...(req.query || {}), active: '1' };
  return listHubs(req, res);
};

module.exports = {
  listHubs,
  listActiveHubsForCustomer,
  createHub,
  updateHub,
  deleteHub,
  getHub: listHubs,
};
