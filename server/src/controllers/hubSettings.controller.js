/**
 * Hub addresses — Masteradmin multi create/update/delete, Delivery member list for directions.
 */
const mongoose = require('mongoose');
const HubSettings = require('../models/hubSettings.model');
const { WEEK_DAYS, defaultWeeklyHours } = require('../models/hubSettings.model');
const { success, error: errorResponse, notFound } = require('../utils/response');
const logger = require('../utils/logger');

function formatLine(hub) {
  return [hub.address, hub.city, hub.state, hub.pincode].filter(Boolean).join(', ');
}

/** Normalize "9:00", "09:00", "09:00AM" → "HH:mm" 24h. */
function normalizeTime(raw, fallback = '09:00') {
  const s = String(raw ?? '').trim().toUpperCase();
  if (!s) return fallback;
  const ampm = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!ampm) {
    const plain = s.match(/^(\d{1,2}):(\d{2})$/);
    if (!plain) return fallback;
    let h = Number(plain[1]);
    const m = Number(plain[2]);
    if (!Number.isFinite(h) || !Number.isFinite(m) || h > 23 || m > 59) return fallback;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  let h = Number(ampm[1]);
  const m = Number(ampm[2]);
  const mer = (ampm[3] || '').toUpperCase();
  if (!Number.isFinite(h) || !Number.isFinite(m) || m > 59) return fallback;
  if (mer === 'PM' && h < 12) h += 12;
  if (mer === 'AM' && h === 12) h = 0;
  if (h > 23) return fallback;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function parseWeeklyHours(raw) {
  const defaults = defaultWeeklyHours();
  if (!Array.isArray(raw) || raw.length === 0) return defaults;
  const byDay = new Map();
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const day = String(item.day || '').trim().toLowerCase();
    if (!WEEK_DAYS.includes(day)) continue;
    byDay.set(day, {
      day,
      openTime: normalizeTime(item.openTime, '09:00'),
      closeTime: normalizeTime(item.closeTime, '18:00'),
      isClosed: item.isClosed === true || item.isClosed === 'true',
    });
  }
  return WEEK_DAYS.map((day) => byDay.get(day) || defaults.find((d) => d.day === day));
}

function formatDisplayTime(hhmm) {
  const m = String(hhmm || '').match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return hhmm || '';
  let h = Number(m[1]);
  const min = m[2];
  const mer = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${String(h).padStart(2, '0')}:${min}${mer}`;
}

function todayHours(weeklyHours) {
  const hours = Array.isArray(weeklyHours) && weeklyHours.length
    ? weeklyHours
    : defaultWeeklyHours();
  // Use India local day for GMP.
  const dayIdx = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
  ).getDay(); // 0 Sun … 6 Sat
  const dayKey = WEEK_DAYS[(dayIdx + 6) % 7]; // monday=0 in WEEK_DAYS
  const today = hours.find((h) => h.day === dayKey) || hours[0];
  return today;
}

function isOpenNow(dayHours) {
  if (!dayHours || dayHours.isClosed) return false;
  const open = normalizeTime(dayHours.openTime, '09:00');
  const close = normalizeTime(dayHours.closeTime, '18:00');
  const nowParts = new Date()
    .toLocaleTimeString('en-GB', {
      timeZone: 'Asia/Kolkata',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    })
    .split(':');
  const nowMins = Number(nowParts[0]) * 60 + Number(nowParts[1]);
  const [oh, om] = open.split(':').map(Number);
  const [ch, cm] = close.split(':').map(Number);
  const openMins = oh * 60 + om;
  const closeMins = ch * 60 + cm;
  if (closeMins <= openMins) {
    // overnight window
    return nowMins >= openMins || nowMins < closeMins;
  }
  return nowMins >= openMins && nowMins < closeMins;
}

function publicHub(hub) {
  if (!hub) return null;
  const weeklyHours = parseWeeklyHours(hub.weeklyHours);
  const today = todayHours(weeklyHours);
  const open = isOpenNow(today);
  return {
    _id: String(hub._id),
    id: String(hub._id),
    name: hub.name || '',
    areaCode: hub.areaCode || '',
    address: hub.address || '',
    city: hub.city || '',
    state: hub.state || '',
    pincode: hub.pincode || '',
    lat: hub.lat == null ? null : Number(hub.lat),
    lng: hub.lng == null ? null : Number(hub.lng),
    notes: hub.notes || '',
    weeklyHours,
    isOpen: open,
    closesAt: today.isClosed ? null : formatDisplayTime(today.closeTime),
    opensAt: today.isClosed ? null : formatDisplayTime(today.openTime),
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
  const areaRaw = str('areaCode') || str('code');
  const areaCode = areaRaw
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 2);
  return {
    name: str('name') || 'GetMyPair Hub',
    areaCode,
    address: str('address'),
    city: str('city'),
    state: str('state'),
    pincode: str('pincode'),
    notes: str('notes'),
    lat: coords.lat,
    lng: coords.lng,
    weeklyHours: parseWeeklyHours(body.weeklyHours),
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
