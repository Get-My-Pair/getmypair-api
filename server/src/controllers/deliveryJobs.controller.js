/**
 * Delivery member portal jobs — nearby pickup/return list and status updates.
 */
const mongoose = require('mongoose');
const AdminMaster = require('../models/adminMaster.model');
const { success, error: errorResponse, notFound } = require('../utils/response');
const logger = require('../utils/logger');
const workflow = require('../services/deliveryWorkflow.service');
const { uploadToCloudinary } = require('../config/cloudinary');

function memberId(req) {
  return req.adminMaster._id;
}

function orderCode(id, publicId) {
  const coded = String(publicId || '')
    .trim()
    .toUpperCase();
  if (coded) return coded;
  return String(id || '').slice(-8).toUpperCase();
}

function orderIdMatches(job, entered) {
  const jobId = job?._id || job;
  const publicId = String(job?.publicId || '')
    .trim()
    .toLowerCase();
  const id = String(jobId || '').toLowerCase();
  const raw = String(entered || '')
    .replace(/[#\s-]/g, '')
    .toLowerCase();
  if (!raw || raw.length < 4) return false;
  if (publicId && (publicId === raw || publicId.includes(raw) || raw.includes(publicId))) {
    return true;
  }
  return id === raw || id.endsWith(raw) || orderCode(jobId, job?.publicId).toLowerCase() === raw;
}

async function resolveProofPhoto(photo) {
  const value = String(photo || '').trim();
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  if (!value.startsWith('data:image')) return '';
  const base64 = value.split(',')[1];
  if (!base64) return '';
  const buf = Buffer.from(base64, 'base64');
  const uploaded = await uploadToCloudinary(buf, { folder: 'getmypair/delivery-proofs' });
  return uploaded.secure_url || '';
}

async function rememberLocation(req) {
  const lat = parseFloat(req.query.lat ?? req.body.lat);
  const lng = parseFloat(req.query.lng ?? req.body.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    await AdminMaster.updateOne({ _id: memberId(req) }, { lastLat: lat, lastLng: lng });
    return { lat, lng };
  }
  const member = await AdminMaster.findById(memberId(req)).select('lastLat lastLng').lean();
  if (member?.lastLat != null && member?.lastLng != null) {
    return { lat: member.lastLat, lng: member.lastLng };
  }
  return null;
}

const listJobs = async (req, res) => {
  try {
    const tab = String(req.query.tab || req.query.status || 'all').trim().toLowerCase();
    const q = String(req.query.q || '').trim();
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const skip = (page - 1) * limit;
    const origin = await rememberLocation(req);
    const mid = memberId(req);

    let filter;
    if (tab === 'pickup') filter = workflow.pickupAssignedFilter(mid);
    else if (tab === 'return') {
      // Available return jobs + this rider's active return trips.
      filter = {
        $or: [workflow.returnReadyFilter(null), workflow.returnAssignedFilter(mid)],
      };
    } else if (tab === 'picked') {
      filter = {
        deliveryMemberId: mid,
        trackingState: 'item_picked',
        status: { $nin: ['cancelled', 'completed'] },
      };
    } else if (tab === 'nearby' || tab === 'available') {
      // After Repairshops accept — waiting for pickup partner.
      filter = workflow.pickupReadyFilter(null);
    } else if (tab === 'completed' || tab === 'done') {
      filter = {
        deliveryMemberId: mid,
        $or: [
          { status: 'completed' },
          { trackingState: 'delivered' },
          { workflowStatus: { $in: ['DELIVERED', 'CLOSED'] } },
        ],
      };
    } else {
      // All — this rider's active pickup/return work + open pickup/return offers.
      filter = {
        status: { $nin: ['cancelled', 'completed'] },
        $or: [
          workflow.pickupReadyFilter(null),
          workflow.returnReadyFilter(null),
          { deliveryMemberId: mid },
        ],
      };
    }

    const idFilter = workflow.searchJobFilter(q);
    if (idFilter) Object.assign(filter, idFilter);

    let query = workflow.ServiceRequest.find(filter);
    if (!origin) query = query.sort({ createdAt: -1 });
    const items = await query.skip(origin ? 0 : skip).limit(origin ? 200 : limit).lean();

    let enriched = await workflow.enrichDeliveryJobs(items, origin);
    if (q && !idFilter) {
      const needle = q.toLowerCase();
      enriched = enriched.filter((row) => {
        const blob = [
          row.user?.name,
          row.user?.mobile,
          row.article?.name,
          row.article?.brand,
          row.pickupAddress?.line,
          row.pickupLocationLabel,
          row.store?.name,
          row.serviceType,
          row.orderCode,
          row.publicId,
          String(row._id || ''),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return blob.includes(needle);
      });
    }

    const total = origin || (q && !idFilter)
      ? enriched.length
      : await workflow.ServiceRequest.countDocuments(filter);
    const pageItems = origin || (q && !idFilter) ? enriched.slice(skip, skip + limit) : enriched;

    const hints = {
      nearby:
        'Repair orders waiting for pickup after the shop accepted. Claim, collect from customer, then drop at hub.',
      available:
        'Repair orders waiting for pickup after the shop accepted. Claim, collect from customer, then drop at hub.',
      pickup: 'Your active pickups. Collect the pair, then Go to Hub and mark Dropped at hub.',
      picked: 'Pairs you collected — take them to the hub and mark Dropped at hub.',
      return:
        'Return jobs after shop work is done. Claim, collect from hub, then deliver to the customer.',
      completed: 'Jobs you fully delivered to the customer.',
      all: 'Open pickup/return offers plus your active delivery jobs.',
    };

    return success(res, 'Delivery jobs', {
      items: pageItems,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
      origin,
      nearbyHint: hints[tab] || hints.all,
    });
  } catch (err) {
    logger.error(`Delivery list jobs error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

const getJob = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return errorResponse(res, 'Invalid job id', 400);
    const mid = memberId(req);
    const request = await workflow.ServiceRequest.findOne({
      _id: id,
      status: { $nin: ['cancelled', 'completed'] },
      $or: [{ deliveryMemberId: mid }, { deliveryMemberId: null }, { deliveryMemberId: { $exists: false } }],
    }).lean();
    if (!request) return notFound(res, 'Job not found');
    const [job] = await workflow.enrichDeliveryJobs([request]);
    return success(res, 'Delivery job', { job });
  } catch (err) {
    logger.error(`Delivery get job error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

const ACTIONS = {
  start_pickup: {
    requireType: 'pickup',
    from: ['pickup_scheduled', 'request_created'],
    trackingState: 'pickup_scheduled',
    workflowStatus: 'PICKUP_SCHEDULED',
    note: 'Pickup in progress',
  },
  picked_up: {
    requireType: 'pickup',
    from: ['pickup_scheduled', 'request_created', 'pending', null, ''],
    trackingState: 'item_picked',
    workflowStatus: 'PICKUP_SCHEDULED',
    note: 'Footwear picked up from customer',
  },
  drop_at_store: {
    requireType: 'pickup',
    from: ['item_picked'],
    trackingState: 'dark_store_received',
    workflowStatus: 'IN_PROGRESS',
    note: 'Dropped at hub / Repairshops',
  },
  collect_from_store: {
    requireType: 'return',
    from: ['dispatch_ready'],
    trackingState: 'dispatch_ready',
    workflowStatus: 'DELIVERY_SCHEDULED',
    note: 'Collected footwear from Repairshops',
  },
  out_for_delivery: {
    requireType: 'return',
    from: ['dispatch_ready'],
    trackingState: 'out_for_delivery',
    workflowStatus: 'DELIVERY_SCHEDULED',
    note: 'Out for delivery to customer',
  },
  delivered: {
    requireType: 'return',
    from: ['out_for_delivery', 'dispatch_ready'],
    trackingState: 'delivered',
    workflowStatus: 'DELIVERED',
    note: 'Customer received footwear',
  },
};

const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const action = String(req.body.action || '').trim();
    if (!mongoose.Types.ObjectId.isValid(id)) return errorResponse(res, 'Invalid job id', 400);
    const spec = ACTIONS[action];
    if (!spec) {
      return errorResponse(
        res,
        'action must be start_pickup, picked_up, drop_at_store, collect_from_store, out_for_delivery, or delivered',
        400
      );
    }

    const mid = memberId(req);
    const request = await workflow.ServiceRequest.findById(id);
    if (!request) return notFound(res, 'Job not found');
    if (request.status === 'cancelled' || request.status === 'completed') {
      return errorResponse(res, `Cannot update a ${request.status} job`, 400);
    }

    const assignedTo = request.deliveryMemberId ? String(request.deliveryMemberId) : '';
    const isMine = assignedTo && assignedTo === String(mid);
    const isOpen = !assignedTo;
    if (!isMine && !isOpen) {
      return errorResponse(res, 'This job is assigned to another delivery member', 403);
    }

    // Claim open jobs on first action — pickup only after Repairshops accepts.
    if (isOpen) {
      const claimType =
        spec.requireType ||
        (['dispatch_ready', 'out_for_delivery'].includes(request.trackingState)
          ? 'return'
          : 'pickup');
      if (claimType === 'pickup' && !request.darkStoreId) {
        return errorResponse(
          res,
          'This order is not accepted by a repair shop yet — pickup is not available',
          400
        );
      }
      if (
        claimType === 'return' &&
        !['dispatch_ready', 'out_for_delivery'].includes(String(request.trackingState || ''))
      ) {
        return errorResponse(
          res,
          'Return pickup is only available after the shop finishes work (dispatch ready)',
          400
        );
      }
      request.deliveryMemberId = mid;
      request.deliveryAssignmentType = claimType;
      request.deliveryAssignedAt = new Date();
      if (claimType === 'pickup' && !request.pickupAssignedAt) {
        request.pickupAssignedAt = new Date();
      }
      if (
        claimType === 'pickup' &&
        (!request.trackingState ||
          request.trackingState === 'request_created' ||
          request.trackingState === 'pending')
      ) {
        workflow.applyTracking(request, 'pickup_scheduled', { workflowStatus: 'PICKUP_SCHEDULED' });
      }
    }

    // Collect can set/repair missing pickup assignment type for this rider.
    if (
      action === 'picked_up' &&
      isMine &&
      (!request.deliveryAssignmentType || request.deliveryAssignmentType === 'pickup')
    ) {
      request.deliveryAssignmentType = 'pickup';
    }

    if (
      spec.requireType &&
      request.deliveryAssignmentType &&
      request.deliveryAssignmentType !== spec.requireType
    ) {
      return errorResponse(res, `This action is only for ${spec.requireType} jobs`, 400);
    }
    const stateNow = request.trackingState || '';
    if (spec.from && !spec.from.includes(stateNow) && !(spec.from.includes(null) && !stateNow)) {
      return errorResponse(
        res,
        `Job is ${request.trackingState || 'new'}; ${action} is not allowed yet`,
        400
      );
    }

    const needsProof = action === 'picked_up' || action === 'delivered';
    let proofUrl = '';
    if (needsProof) {
      const orderId = String(req.body.orderId || '').trim();
      const photo = req.body.photo;
      const idOk = orderIdMatches(request, orderId);
      if (!idOk && !photo) {
        return errorResponse(
          res,
          'Upload a pickup photo or enter the matching order id to confirm collection',
          400
        );
      }
      if (orderId && !idOk) {
        return errorResponse(res, 'Order id does not match this job', 400);
      }
      if (photo) {
        try {
          proofUrl = await resolveProofPhoto(photo);
        } catch (err) {
          logger.warn(`Delivery proof upload failed: ${err.message}`);
        }
      }
      if (!idOk && !proofUrl) {
        return errorResponse(
          res,
          'Upload a pickup photo or enter the matching order id to confirm collection',
          400
        );
      }
      if (proofUrl) {
        request.photos = Array.isArray(request.photos) ? request.photos : [];
        request.photos.push(proofUrl);
      }
    }

    workflow.applyTracking(request, spec.trackingState, { workflowStatus: spec.workflowStatus });
    if (action === 'drop_at_store') {
      // Free the rider assignment so a return partner can claim after shop work.
      request.deliveryAssignmentType = null;
      request.status = 'in_service';
    }
    if (action === 'delivered') {
      request.status = 'completed';
      request.workflowStatus = 'DELIVERED';
    }
    const claimNote = isOpen ? `Claimed job · ${spec.note}` : spec.note;
    workflow.pushLifecycle(request, {
      actorType: 'delivery',
      actorId: mid,
      note: proofUrl ? `${claimNote} (photo proof)` : claimNote,
      photos: proofUrl ? [proofUrl] : [],
    });
    await request.save();

    const [job] = await workflow.enrichDeliveryJobs([request.toObject()]);
    return success(res, isOpen ? `Claimed · ${spec.note}` : spec.note, { job });
  } catch (err) {
    logger.error(`Delivery update status error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

module.exports = { listJobs, getJob, updateStatus };
