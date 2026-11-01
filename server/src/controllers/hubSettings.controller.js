/**
 * Hub address — Masteradmin create/update, Delivery member read for directions.
 */
const HubSettings = require('../models/hubSettings.model');
const { success, error: errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

function formatLine(hub) {
  return [hub.address, hub.city, hub.state, hub.pincode].filter(Boolean).join(', ');
}

function publicHub(hub) {
  if (!hub) {
    return {
      name: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      lat: null,
      lng: null,
      notes: '',
      line: '',
      updatedAt: null,
    };
  }
  return {
    name: hub.name || '',
    address: hub.address || '',
    city: hub.city || '',
    state: hub.state || '',
    pincode: hub.pincode || '',
    lat: hub.lat == null ? null : Number(hub.lat),
    lng: hub.lng == null ? null : Number(hub.lng),
    notes: hub.notes || '',
    line: formatLine(hub),
    updatedAt: hub.updatedAt || null,
  };
}

const getHub = async (req, res) => {
  try {
    const hub = await HubSettings.getHub();
    return success(res, 'Hub address', { hub: publicHub(hub) });
  } catch (err) {
    logger.error(`Get hub address error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

const upsertHub = async (req, res) => {
  try {
    const str = (key) => String(req.body[key] ?? '').trim();
    const name = str('name') || 'GetMyPair Hub';
    const address = str('address');
    const city = str('city');
    const state = str('state');
    const pincode = str('pincode');
    const notes = str('notes');

    if (!address) {
      return errorResponse(res, 'Hub street address is required', 400);
    }

    let lat = req.body.lat;
    let lng = req.body.lng;
    lat = lat === '' || lat == null ? null : Number(lat);
    lng = lng === '' || lng == null ? null : Number(lng);
    if (lat != null && !Number.isFinite(lat)) {
      return errorResponse(res, 'lat must be a number', 400);
    }
    if (lng != null && !Number.isFinite(lng)) {
      return errorResponse(res, 'lng must be a number', 400);
    }

    const hub = await HubSettings.findOneAndUpdate(
      { key: HubSettings.HUB_KEY },
      {
        $set: {
          name,
          address,
          city,
          state,
          pincode,
          notes,
          lat,
          lng,
          updatedBy: req.adminMaster?._id || null,
        },
        $setOnInsert: { key: HubSettings.HUB_KEY },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    return success(res, 'Hub address saved', { hub: publicHub(hub) });
  } catch (err) {
    logger.error(`Upsert hub address error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

module.exports = { getHub, upsertHub };
