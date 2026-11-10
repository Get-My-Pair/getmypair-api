/**
 * Shared footwear service workflow for Repairshops + Delivery member portals.
 */
const mongoose = require('mongoose');
const { ServiceRequest } = require('../models/serviceRequest.model');
const User = require('../models/user.model');
const UserProfile = require('../models/userProfile.model');
const Article = require('../models/article.model');
const AdminMaster = require('../models/adminMaster.model');
const HubSettings = require('../models/hubSettings.model');
const { forwardGeocode } = require('./geocode.service');
const logger = require('../utils/logger');

const TRACKING_TO_STATUS = {
  request_created: 'pending',
  pickup_scheduled: 'pickup_assigned',
  item_picked: 'pickup_assigned',
  dark_store_received: 'in_service',
  inspection_started: 'in_service',
  repair_in_progress: 'in_service',
  repair_completed: 'in_service',
  dispatch_ready: 'in_service',
  out_for_delivery: 'in_service',
  delivered: 'completed',
  cancelled: 'cancelled',
};

const PROGRESS_ACTIONS = {
  inspection: {
    trackingState: 'inspection_started',
    workflowStatus: 'IN_PROGRESS',
    note: 'Repairshops started inspection',
  },
  in_progress: {
    trackingState: 'repair_in_progress',
    workflowStatus: 'IN_PROGRESS',
    note: 'Work in progress',
  },
  work_done: {
    trackingState: 'repair_completed',
    workflowStatus: 'WORK_COMPLETED',
    note: 'Service work completed',
  },
  qc_pass: {
    trackingState: 'dispatch_ready',
    workflowStatus: 'DELIVERY_SCHEDULED',
    note: 'Quality check passed — ready for delivery',
  },
  qc_fail: {
    trackingState: 'repair_in_progress',
    workflowStatus: 'IN_PROGRESS',
    note: 'Quality check failed — returned to cobbler',
  },
};

function haversineKm(aLat, aLng, bLat, bLng) {
  const lat1 = Number(aLat);
  const lng1 = Number(aLng);
  const lat2 = Number(bLat);
  const lng2 = Number(bLng);
  if (![lat1, lng1, lat2, lng2].every((n) => Number.isFinite(n))) return null;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/** Reject null-island / garbage coords that produce ~9000km distances. */
function isValidMapCoord(lat, lng) {
  const a = Number(lat);
  const b = Number(lng);
  if (![a, b].every((n) => Number.isFinite(n))) return false;
  if (Math.abs(a) < 0.001 && Math.abs(b) < 0.001) return false;
  if (Math.abs(a) > 90 || Math.abs(b) > 180) return false;
  return true;
}

function isIndiaCoord(lat, lng) {
  const a = Number(lat);
  const b = Number(lng);
  return a >= 6 && a <= 37.5 && b >= 68 && b <= 98;
}

function normalizeCoord(lat, lng) {
  if (!isValidMapCoord(lat, lng)) return null;
  return { lat: Number(lat), lng: Number(lng) };
}

function roundKm(km) {
  if (km == null || !Number.isFinite(km)) return null;
  // City logistics: hide absurd cross-continent distances from bad GPS.
  if (km > 2500) return null;
  return Math.round(km * 10) / 10;
}

const geocodeMemo = new Map();

async function geocodeQuery(query) {
  const key = String(query || '')
    .trim()
    .toLowerCase();
  if (!key || key.length < 6) return null;
  if (geocodeMemo.has(key)) return geocodeMemo.get(key);
  try {
    const loc = await forwardGeocode(query, { countrycodes: 'in' });
    const point = normalizeCoord(loc.lat, loc.lon);
    geocodeMemo.set(key, point);
    // Nominatim fair-use: ~1 req/sec
    await new Promise((r) => setTimeout(r, 1100));
    return point;
  } catch (err) {
    logger.warn(`Pickup geocode failed for "${query}": ${err.message}`);
    geocodeMemo.set(key, null);
    return null;
  }
}

function paidConfirmedFilter(extra = {}) {
  return {
    status: { $nin: ['cancelled', 'completed'] },
    actualCostUserDecision: 'accepted',
    $or: [{ paymentState: 'PAYMENT_SUCCESS' }, { workflowStatus: 'PAYMENT_SUCCESS' }],
    ...extra,
  };
}

/**
 * Pickup jobs waiting for a delivery partner — only after Repairshops accepts
 * (darkStoreId set). No cobbler / hub-received work yet.
 */
function pickupReadyFilter(storeId) {
  const filter = {
    status: { $nin: ['cancelled', 'completed'] },
    trackingState: {
      $in: ['request_created', 'pickup_scheduled', 'pickup_assigned'],
    },
    $and: [
      // Shop must have accepted the job.
      {
        darkStoreId: storeId
          ? String(storeId)
          : { $exists: true, $nin: [null, ''] },
      },
      {
        $or: [
          { deliveryMemberId: null },
          { deliveryMemberId: { $exists: false } },
          { deliveryAssignmentType: { $in: [null, 'return'] } },
        ],
      },
    ],
  };
  return filter;
}

function pickupAssignedFilter(memberId) {
  // Active pickups for this rider — including after collect (go to hub next).
  return {
    status: { $nin: ['cancelled', 'completed'] },
    $or: [
      {
        deliveryMemberId: memberId,
        deliveryAssignmentType: 'pickup',
        trackingState: { $in: ['pickup_scheduled', 'item_picked', 'request_created'] },
      },
      {
        deliveryMemberId: memberId,
        trackingState: 'item_picked',
      },
    ],
  };
}

function formatHubLine(hub) {
  return [hub.address, hub.city, hub.state, hub.pincode].filter(Boolean).join(', ');
}

function pickNearestHub(hubs, fromLat, fromLng) {
  if (!hubs.length) return null;
  const from = normalizeCoord(fromLat, fromLng);
  let best = null;
  for (const hub of hubs) {
    const line = formatHubLine(hub);
    const hubPoint = normalizeCoord(hub.lat, hub.lng);
    const distanceKm =
      from && hubPoint ? roundKm(haversineKm(from.lat, from.lng, hubPoint.lat, hubPoint.lng)) : null;
    const candidate = {
      _id: String(hub._id),
      name: hub.name || 'GetMyPair Hub',
      line,
      lat: hubPoint?.lat ?? null,
      lng: hubPoint?.lng ?? null,
      notes: hub.notes || '',
      distanceKm,
    };
    if (!best) {
      best = candidate;
      continue;
    }
    if (candidate.distanceKm == null) continue;
    if (best.distanceKm == null || candidate.distanceKm < best.distanceKm) best = candidate;
  }
  return best;
}

/**
 * Return jobs waiting for a delivery partner — after shop QC / dispatch_ready.
 */
function returnReadyFilter(storeId) {
  const filter = {
    trackingState: 'dispatch_ready',
    status: { $nin: ['cancelled', 'completed'] },
    darkStoreId: storeId
      ? String(storeId)
      : { $exists: true, $nin: [null, ''] },
    $or: [
      { deliveryMemberId: null },
      { deliveryMemberId: { $exists: false } },
      { deliveryAssignmentType: { $ne: 'return' } },
    ],
  };
  return filter;
}

function returnAssignedFilter(memberId) {
  return {
    deliveryMemberId: memberId,
    status: { $nin: ['cancelled', 'completed'] },
    $or: [
      {
        deliveryAssignmentType: 'return',
        trackingState: { $in: ['dispatch_ready', 'out_for_delivery'] },
      },
      // Keep in-progress return cards visible even if assignment type was missing.
      { trackingState: 'out_for_delivery' },
    ],
  };
}

function receivedAtStoreFilter(storeId) {
  return {
    darkStoreId: String(storeId),
    trackingState: {
      $in: [
        'item_picked',
        'dark_store_received',
        'inspection_started',
        'repair_in_progress',
        'repair_completed',
        'dispatch_ready',
      ],
    },
    status: { $nin: ['cancelled', 'completed'] },
  };
}

function pushLifecycle(request, { actorType, actorId, note, photos = [] }) {
  request.lifecycleEvents = Array.isArray(request.lifecycleEvents) ? request.lifecycleEvents : [];
  request.lifecycleEvents.push({
    state: request.trackingState || 'request_created',
    status: request.status,
    actorType,
    actorId: actorId ? String(actorId) : null,
    note,
    media: { photos: photos.filter(Boolean), videos: [] },
    timestamp: new Date(),
  });
}

function applyTracking(request, trackingState, extras = {}) {
  request.trackingState = trackingState;
  request.trackingUpdatedAt = new Date();
  if (TRACKING_TO_STATUS[trackingState]) {
    request.status = TRACKING_TO_STATUS[trackingState];
  }
  if (extras.workflowStatus) request.workflowStatus = extras.workflowStatus;
  Object.assign(request, extras.fields || {});
}

function formatAddress(addr) {
  if (!addr) return '';
  return [addr.addressLine1, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ');
}

async function enrichDeliveryJobs(requests, origin = null) {
  if (!requests.length) return [];
  const userIds = [...new Set(requests.map((r) => String(r.userId)).filter(Boolean))];
  const articleIds = [...new Set(requests.map((r) => String(r.articleId)).filter(Boolean))];
  const memberIds = [
    ...new Set(requests.map((r) => (r.deliveryMemberId ? String(r.deliveryMemberId) : null)).filter(Boolean)),
  ];
  const storeIds = [...new Set(requests.map((r) => String(r.darkStoreId || '')).filter(Boolean))];

  const [users, profiles, articles, members, stores, hubs] = await Promise.all([
    userIds.length ? User.find({ _id: { $in: userIds } }).select('name mobile email location').lean() : [],
    userIds.length
      ? UserProfile.find({ userId: { $in: userIds } }).select('userId name phone addresses').lean()
      : [],
    articleIds.length
      ? Article.find({ _id: { $in: articleIds } }).select('name brand model').lean()
      : [],
    memberIds.length
      ? AdminMaster.find({ _id: { $in: memberIds } }).select('name email phone photoUrl').lean()
      : [],
    storeIds.filter((id) => mongoose.Types.ObjectId.isValid(id)).length
      ? AdminMaster.find({
          _id: { $in: storeIds.filter((id) => mongoose.Types.ObjectId.isValid(id)) },
        })
          .select('name storeName address city state pincode lastLat lastLng')
          .lean()
      : [],
    HubSettings.find({ isActive: { $ne: false } })
      .select('name address city state pincode lat lng notes')
      .lean(),
  ]);

  const userMap = Object.fromEntries(users.map((u) => [String(u._id), u]));
  const profileMap = Object.fromEntries(profiles.map((p) => [String(p.userId), p]));
  const articleMap = Object.fromEntries(articles.map((a) => [String(a._id), a]));
  const memberMap = Object.fromEntries(members.map((m) => [String(m._id), m]));
  const storeMap = Object.fromEntries(stores.map((s) => [String(s._id), s]));
  let activeHubs = Array.isArray(hubs) ? hubs : [];

  // Geocode hubs missing valid lat/lng (once per enrich call).
  for (const hub of activeHubs) {
    if (normalizeCoord(hub.lat, hub.lng)) continue;
    const line = formatHubLine(hub);
    if (!line) continue;
    const point = await geocodeQuery(line);
    if (point) {
      hub.lat = point.lat;
      hub.lng = point.lng;
    }
  }

  const draft = requests.map((r) => {
    const user = userMap[String(r.userId)] || null;
    const profile = profileMap[String(r.userId)] || null;
    const addresses = profile?.addresses || [];
    const pickupAddress =
      addresses.find((a) => String(a._id) === String(r.addressId)) || addresses[0] || null;
    const addressLine = pickupAddress
      ? formatAddress(pickupAddress)
      : user?.location?.address || '';
    const rawPoint = normalizeCoord(
      pickupAddress?.lat ?? pickupAddress?.location?.lat ?? user?.location?.lat,
      pickupAddress?.lng ?? pickupAddress?.location?.lng ?? user?.location?.lng
    );
    // Prefer India-plausible stored coords; otherwise geocode the address text.
    const storedOk = rawPoint && isIndiaCoord(rawPoint.lat, rawPoint.lng) ? rawPoint : null;
    return {
      r,
      user,
      profile,
      pickupAddress,
      addressLine,
      storedOk,
      needsGeocode: !storedOk && Boolean(addressLine),
    };
  });

  const uniqueQueries = [
    ...new Set(draft.filter((d) => d.needsGeocode).map((d) => d.addressLine)),
  ];
  const geocoded = new Map();
  for (const q of uniqueQueries.slice(0, 8)) {
    geocoded.set(q, await geocodeQuery(q));
  }

  const originOk = origin && normalizeCoord(origin.lat, origin.lng);

  const mapped = draft.map((d) => {
    const { r, user, profile, pickupAddress, addressLine, storedOk } = d;
    const geocodedPoint = addressLine ? geocoded.get(addressLine) : null;
    const pickupPoint = storedOk || geocodedPoint || null;
    const lat = pickupPoint?.lat ?? null;
    const lng = pickupPoint?.lng ?? null;
    const store = r.darkStoreId ? storeMap[String(r.darkStoreId)] || null : null;

    let distanceKm = null;
    if (originOk && pickupPoint) {
      // Only show rider→pickup km when both points look like the same region
      // (avoids 8000km+ when browser GPS is wrong / abroad).
      const bothIndia =
        isIndiaCoord(originOk.lat, originOk.lng) && isIndiaCoord(pickupPoint.lat, pickupPoint.lng);
      if (bothIndia || (!isIndiaCoord(originOk.lat, originOk.lng) && !isIndiaCoord(pickupPoint.lat, pickupPoint.lng))) {
        distanceKm = roundKm(haversineKm(originOk.lat, originOk.lng, pickupPoint.lat, pickupPoint.lng));
      }
    }

    // Nearest drop hub = pickup address → hub (not rider live location).
    const nearestHub = pickNearestHub(activeHubs, lat, lng);
    const hubKm = nearestHub?.distanceKm ?? null;
    const totalKm =
      distanceKm != null && hubKm != null ? roundKm(distanceKm + hubKm) : hubKm ?? distanceKm;

    return {
      ...r,
      user: user
        ? { name: user.name, mobile: user.mobile, email: user.email }
        : profile
          ? { name: profile.name, mobile: profile.phone, email: null }
          : null,
      article: articleMap[String(r.articleId)] || null,
      deliveryMember: r.deliveryMemberId ? memberMap[String(r.deliveryMemberId)] || null : null,
      pickupAddress: addressLine
        ? {
            line: addressLine,
            city: pickupAddress?.city || '',
            pincode: pickupAddress?.pincode || '',
          }
        : null,
      pickupLocationLabel: addressLine || 'Pickup location not set',
      pickupGeo: pickupPoint,
      orderCode: String(r.publicId || '')
        .trim()
        .toUpperCase() || String(r._id).slice(-8).toUpperCase(),
      publicId: r.publicId || null,
      store: store
        ? {
            name: store.storeName || store.name,
            address: [store.address, store.city, store.state, store.pincode].filter(Boolean).join(', '),
          }
        : { name: r.darkStoreName || 'Repairshops', address: '' },
      distanceKm,
      nearestHub,
      hubDistanceKm: hubKm,
      totalKm,
      isUnassigned: !r.deliveryMemberId,
    };
  });

  mapped.sort((a, b) => {
    const aKey =
      a.trackingState === 'item_picked'
        ? a.hubDistanceKm ?? a.distanceKm
        : a.distanceKm ?? a.hubDistanceKm;
    const bKey =
      b.trackingState === 'item_picked'
        ? b.hubDistanceKm ?? b.distanceKm
        : b.distanceKm ?? b.hubDistanceKm;
    if (aKey == null && bKey == null) return 0;
    if (aKey == null) return 1;
    if (bKey == null) return -1;
    return aKey - bKey;
  });
  return mapped;
}

function searchJobFilter(q) {
  const term = String(q || '').trim();
  if (!term) return null;
  if (mongoose.Types.ObjectId.isValid(term)) {
    return { _id: term };
  }
  const code = term.replace(/^#/, '').toUpperCase();
  if (code.length >= 4) {
    return {
      $or: [
        { publicId: new RegExp(`^${code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i') },
        { publicId: code },
      ],
    };
  }
  return null;
}

module.exports = {
  TRACKING_TO_STATUS,
  PROGRESS_ACTIONS,
  haversineKm,
  paidConfirmedFilter,
  pickupReadyFilter,
  pickupAssignedFilter,
  returnReadyFilter,
  returnAssignedFilter,
  receivedAtStoreFilter,
  pushLifecycle,
  applyTracking,
  enrichDeliveryJobs,
  searchJobFilter,
  ServiceRequest,
};
