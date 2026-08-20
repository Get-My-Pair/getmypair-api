/**
 * Shared footwear service workflow for Darkworkstore + Delivery member portals.
 */
const mongoose = require('mongoose');
const { ServiceRequest } = require('../models/serviceRequest.model');
const User = require('../models/user.model');
const UserProfile = require('../models/userProfile.model');
const Article = require('../models/article.model');
const AdminMaster = require('../models/adminMaster.model');

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
    note: 'Darkworkstore started inspection',
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

function paidConfirmedFilter(extra = {}) {
  return {
    status: { $nin: ['cancelled', 'completed'] },
    actualCostUserDecision: 'accepted',
    $or: [{ paymentState: 'PAYMENT_SUCCESS' }, { workflowStatus: 'PAYMENT_SUCCESS' }],
    ...extra,
  };
}

function pickupReadyFilter(storeId) {
  const filter = {
    status: { $nin: ['cancelled', 'completed'] },
    actualCostUserDecision: 'accepted',
    trackingState: { $nin: ['item_picked', 'dark_store_received', 'inspection_started', 'repair_in_progress', 'repair_completed', 'dispatch_ready', 'out_for_delivery', 'delivered'] },
    $and: [
      { $or: [{ paymentState: 'PAYMENT_SUCCESS' }, { workflowStatus: 'PAYMENT_SUCCESS' }] },
      {
        $or: [
          { deliveryMemberId: null },
          { deliveryAssignmentType: { $in: [null, 'return'] } },
        ],
      },
    ],
  };
  if (storeId) filter.darkStoreId = String(storeId);
  return filter;
}

function pickupAssignedFilter(memberId) {
  return {
    deliveryMemberId: memberId,
    deliveryAssignmentType: 'pickup',
    status: { $nin: ['cancelled', 'completed'] },
    trackingState: { $in: ['pickup_scheduled', 'item_picked'] },
  };
}

function returnReadyFilter(storeId) {
  const filter = {
    trackingState: 'dispatch_ready',
    status: { $nin: ['cancelled', 'completed'] },
    $or: [{ deliveryAssignmentType: { $ne: 'return' } }, { deliveryMemberId: null }],
  };
  if (storeId) filter.darkStoreId = String(storeId);
  return filter;
}

function returnAssignedFilter(memberId) {
  return {
    deliveryMemberId: memberId,
    deliveryAssignmentType: 'return',
    status: { $nin: ['cancelled', 'completed'] },
    trackingState: { $in: ['dispatch_ready', 'out_for_delivery'] },
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

  const [users, profiles, articles, members, stores] = await Promise.all([
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
  ]);

  const userMap = Object.fromEntries(users.map((u) => [String(u._id), u]));
  const profileMap = Object.fromEntries(profiles.map((p) => [String(p.userId), p]));
  const articleMap = Object.fromEntries(articles.map((a) => [String(a._id), a]));
  const memberMap = Object.fromEntries(members.map((m) => [String(m._id), m]));
  const storeMap = Object.fromEntries(stores.map((s) => [String(s._id), s]));

  const mapped = requests.map((r) => {
    const user = userMap[String(r.userId)] || null;
    const profile = profileMap[String(r.userId)] || null;
    const addresses = profile?.addresses || [];
    const pickupAddress =
      addresses.find((a) => String(a._id) === String(r.addressId)) || addresses[0] || null;
    const lat = user?.location?.lat ?? null;
    const lng = user?.location?.lng ?? null;
    const store = r.darkStoreId ? storeMap[String(r.darkStoreId)] || null : null;
    const distanceKm = origin ? haversineKm(origin.lat, origin.lng, lat, lng) : null;
    return {
      ...r,
      user: user
        ? { name: user.name, mobile: user.mobile, email: user.email }
        : profile
          ? { name: profile.name, mobile: profile.phone, email: null }
          : null,
      article: articleMap[String(r.articleId)] || null,
      deliveryMember: r.deliveryMemberId ? memberMap[String(r.deliveryMemberId)] || null : null,
      pickupAddress: pickupAddress
        ? {
            line: formatAddress(pickupAddress),
            city: pickupAddress.city || '',
            pincode: pickupAddress.pincode || '',
          }
        : user?.location?.address
          ? { line: user.location.address, city: '', pincode: '' }
          : null,
      pickupGeo: lat != null && lng != null ? { lat, lng } : null,
      orderCode: String(r._id).slice(-8).toUpperCase(),
      store: store
        ? {
            name: store.storeName || store.name,
            address: [store.address, store.city, store.state, store.pincode].filter(Boolean).join(', '),
          }
        : { name: r.darkStoreName || 'Darkworkstore', address: '' },
      distanceKm: distanceKm == null ? null : Math.round(distanceKm * 10) / 10,
    };
  });

  if (origin) {
    mapped.sort((a, b) => {
      if (a.distanceKm == null && b.distanceKm == null) return 0;
      if (a.distanceKm == null) return 1;
      if (b.distanceKm == null) return -1;
      return a.distanceKm - b.distanceKm;
    });
  }
  return mapped;
}

function searchJobFilter(q) {
  const term = String(q || '').trim();
  if (!term) return null;
  if (mongoose.Types.ObjectId.isValid(term)) {
    return { _id: term };
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
