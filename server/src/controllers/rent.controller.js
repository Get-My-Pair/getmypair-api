const mongoose = require('mongoose');
const RentListing = require('../models/rentListing.model');
const { RENT_DURATIONS } = require('../models/rentListing.model');
const RentRequest = require('../models/rentRequest.model');
const { success, error: errorResponse, notFound } = require('../utils/response');
const paymentService = require('../services/payment.service');
const logger = require('../utils/logger');
const { uploadToCloudinary } = require('../config/cloudinary');

const DURATION_LABELS = {
  week: '1 week',
  month: '1 month',
  '3month': '3 months',
  '6month': '6 months',
  '1year': '1 year',
};

const mapUser = (user) => {
  if (!user || !user._id) return null;
  return {
    _id: user._id,
    name: user.name || '',
    mobile: user.mobile || '',
  };
};

const mapListing = (row, requestCount) => {
  const owner = row.ownerId && row.ownerId._id ? row.ownerId : null;
  return {
    _id: row._id,
    ownerId: owner ? owner._id : row.ownerId,
    title: row.title || 'Footwear',
    imageUrl: row.imageUrl,
    duration: row.duration,
    durationLabel: DURATION_LABELS[row.duration] || row.duration,
    price: row.price,
    status: row.status,
    rejectReason: row.rejectReason || null,
    reviewedAt: row.reviewedAt || null,
    createdAt: row.createdAt,
    owner: mapUser(owner),
    requestCount: requestCount == null ? undefined : requestCount,
  };
};

const mapRequest = (row) => {
  const listing = row.listingId && row.listingId._id ? row.listingId : null;
  const owner = row.ownerId && row.ownerId._id ? row.ownerId : null;
  const renter = row.renterId && row.renterId._id ? row.renterId : null;
  return {
    _id: row._id,
    listingId: listing ? listing._id : row.listingId,
    ownerId: owner ? owner._id : row.ownerId,
    renterId: renter ? renter._id : row.renterId,
    duration: row.duration,
    durationLabel: DURATION_LABELS[row.duration] || row.duration,
    price: row.price,
    paymentStatus: row.paymentStatus,
    paidAmount: row.paidAmount,
    paidAt: row.paidAt,
    status: row.status,
    createdAt: row.createdAt,
    listing: listing
      ? {
          _id: listing._id,
          title: listing.title || 'Footwear',
          imageUrl: listing.imageUrl,
          duration: listing.duration,
          price: listing.price,
          status: listing.status,
        }
      : null,
    owner: mapUser(owner),
    renter: mapUser(renter),
  };
};

const populateListing = (query) => query.populate('ownerId', 'name mobile');

const populateRequest = (query) =>
  query
    .populate('listingId', 'title imageUrl duration price status')
    .populate('ownerId', 'name mobile')
    .populate('renterId', 'name mobile');

const uploadImage = async (req, res) => {
  try {
    if (!req.file) return errorResponse(res, 'No file uploaded', 400);
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'getmypair/rent-footwear',
      public_id: `rent-${req.user._id}-${Date.now()}`,
      resource_type: 'image',
      transformation: [{ width: 1600, height: 1600, crop: 'limit', quality: 'auto' }],
    });
    return success(res, 'Photo uploaded', { imageUrl: result.secure_url });
  } catch (err) {
    logger.error(`Upload rent image error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

const createListing = async (req, res) => {
  try {
    const title = String(req.body.title || 'Footwear').trim() || 'Footwear';
    const imageUrl = String(req.body.imageUrl || '').trim();
    const duration = String(req.body.duration || '').trim();
    const price = Number(req.body.price);
    if (!imageUrl) return errorResponse(res, 'Upload a footwear photo', 400);
    if (!RENT_DURATIONS.includes(duration)) {
      return errorResponse(res, 'Choose a rent duration', 400);
    }
    if (!Number.isFinite(price) || price < 1) {
      return errorResponse(res, 'Enter a rent price', 400);
    }

    const listing = await RentListing.create({
      ownerId: req.user._id,
      title: title.slice(0, 80),
      imageUrl,
      duration,
      price,
      status: 'pending',
    });
    const saved = await populateListing(RentListing.findById(listing._id)).lean();
    logger.info(`Rent listing created: ${listing._id}`);
    return success(res, 'Submitted for approval', { listing: mapListing(saved, 0) }, 201);
  } catch (err) {
    logger.error(`Create rent listing error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

const listMine = async (req, res) => {
  try {
    const rows = await populateListing(
      RentListing.find({ ownerId: req.user._id }).sort({ createdAt: -1 })
    ).lean();
    const ids = rows.map((row) => row._id);
    const counts = await RentRequest.aggregate([
      { $match: { listingId: { $in: ids } } },
      { $group: { _id: '$listingId', count: { $sum: 1 } } },
    ]);
    const countById = new Map(counts.map((row) => [String(row._id), row.count]));
    return success(res, 'Your rent footwear', {
      listings: rows.map((row) => mapListing(row, countById.get(String(row._id)) || 0)),
    });
  } catch (err) {
    logger.error(`List my rent listings error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

const listAvailable = async (req, res) => {
  try {
    const rows = await populateListing(
      RentListing.find({ status: 'approved' }).sort({ createdAt: -1 })
    ).lean();
    return success(res, 'Available rent footwear', {
      listings: rows.map((row) => mapListing(row)),
    });
  } catch (err) {
    logger.error(`List available rent listings error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

const checkout = async (req, res) => {
  try {
    const listingId = String(req.body.listingId || '').trim();
    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      return errorResponse(res, 'Footwear not found', 404);
    }
    const listing = await RentListing.findById(listingId);
    if (!listing || listing.status !== 'approved') {
      return notFound(res, 'This footwear is not available to rent');
    }
    const paymentData = await paymentService.createRentPaymentLink(
      {
        listing,
        userId: req.user._id,
        redirectUrl: req.body.redirectUrl,
        paymentMode: req.body.paymentMode,
      },
      req
    );
    return success(res, 'Checkout ready', {
      listing: mapListing(listing.toObject ? listing.toObject() : listing),
      ...paymentData,
    });
  } catch (err) {
    logger.error(`Rent checkout error: ${err.message}`);
    return errorResponse(res, err.message || 'Could not start payment', err.statusCode || 500);
  }
};

const createRequest = async (req, res) => {
  return errorResponse(
    res,
    'Pay with Zoho checkout. The request is created after payment succeeds.',
    400
  );
};

const listIncoming = async (req, res) => {
  try {
    const rows = await populateRequest(
      RentRequest.find({ ownerId: req.user._id, paymentStatus: 'paid' }).sort({ createdAt: -1 })
    ).lean();
    return success(res, 'Rent requests on your footwear', {
      requests: rows.map(mapRequest),
    });
  } catch (err) {
    logger.error(`List incoming rent requests error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

const adminListListings = async (req, res) => {
  try {
    const filter = {};
    const status = String(req.query.status || '').trim();
    if (['pending', 'approved', 'rejected'].includes(status)) filter.status = status;
    const rows = await populateListing(RentListing.find(filter).sort({ createdAt: -1 })).lean();
    return success(res, 'Rent listings', { listings: rows.map((row) => mapListing(row)) });
  } catch (err) {
    logger.error(`Admin list rent listings error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

const adminReviewListing = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return errorResponse(res, 'Listing not found', 404);
    const status = String(req.body.status || '').trim();
    const rejectReason = String(req.body.rejectReason || '').trim();
    if (!['approved', 'rejected'].includes(status)) {
      return errorResponse(res, 'Choose approve or reject', 400);
    }
    if (status === 'rejected' && !rejectReason) {
      return errorResponse(res, 'Add a reason to reject this footwear', 400);
    }
    const listing = await RentListing.findById(id);
    if (!listing) return notFound(res, 'Listing not found');
    if (listing.status !== 'pending') {
      return errorResponse(res, 'This footwear has already been reviewed', 409);
    }
    listing.status = status;
    listing.rejectReason = status === 'rejected' ? rejectReason.slice(0, 500) : null;
    listing.reviewedBy = req.adminMaster ? req.adminMaster._id : null;
    listing.reviewedAt = new Date();
    await listing.save();
    const row = await populateListing(RentListing.findById(listing._id)).lean();
    return success(
      res,
      status === 'approved' ? 'Footwear approved' : 'Footwear rejected',
      { listing: mapListing(row) }
    );
  } catch (err) {
    logger.error(`Admin review rent listing error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

const adminListRequests = async (req, res) => {
  try {
    const rows = await populateRequest(
      RentRequest.find({ paymentStatus: 'paid' }).sort({ createdAt: -1 })
    ).lean();
    return success(res, 'Rent requests', { requests: rows.map(mapRequest) });
  } catch (err) {
    logger.error(`Admin list rent requests error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

const countPendingListings = () => RentListing.countDocuments({ status: 'pending' });
const countRequests = () => RentRequest.countDocuments();

module.exports = {
  uploadImage,
  createListing,
  listMine,
  listAvailable,
  checkout,
  createRequest,
  listIncoming,
  adminListListings,
  adminReviewListing,
  adminListRequests,
  countPendingListings,
  countRequests,
  DURATION_LABELS,
};
