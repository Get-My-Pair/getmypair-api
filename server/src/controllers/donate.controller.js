const mongoose = require('mongoose');
const DonateRequest = require('../models/donateRequest.model');
const { success, error: errorResponse, notFound } = require('../utils/response');
const logger = require('../utils/logger');
const { uploadToCloudinary } = require('../config/cloudinary');

const mapOwner = (owner) => {
  if (!owner || !owner._id) return null;
  return {
    _id: owner._id,
    name: owner.name || '',
    mobile: owner.mobile || '',
  };
};

const mapRequest = (row) => {
  const owner = row.ownerId && row.ownerId._id ? row.ownerId : null;
  return {
    _id: row._id,
    ownerId: owner ? owner._id : row.ownerId,
    imageUrl: row.imageUrl,
    note: row.note || '',
    status: row.status,
    rejectReason: row.rejectReason || null,
    reviewedAt: row.reviewedAt || null,
    createdAt: row.createdAt,
    owner: mapOwner(owner),
  };
};

const populate = (query) => query.populate('ownerId', 'name mobile');

const uploadImage = async (req, res) => {
  try {
    if (!req.file) return errorResponse(res, 'No file uploaded', 400);
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'getmypair/donate-footwear',
      public_id: `donate-${req.user._id}-${Date.now()}`,
      resource_type: 'image',
      transformation: [{ width: 1600, height: 1600, crop: 'limit', quality: 'auto' }],
    });
    return success(res, 'Photo uploaded', { imageUrl: result.secure_url });
  } catch (err) {
    logger.error(`Upload donate image error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

const createRequest = async (req, res) => {
  try {
    const imageUrl = String(req.body.imageUrl || '').trim();
    const note = String(req.body.note || '').trim().slice(0, 500);
    if (!imageUrl) return errorResponse(res, 'Upload a footwear photo', 400);
    const request = await DonateRequest.create({
      ownerId: req.user._id,
      imageUrl,
      note,
      status: 'pending',
    });
    const saved = await populate(DonateRequest.findById(request._id)).lean();
    logger.info(`Donate request created: ${request._id}`);
    return success(res, 'Donation request submitted', { request: mapRequest(saved) }, 201);
  } catch (err) {
    logger.error(`Create donate request error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

const listMine = async (req, res) => {
  try {
    const rows = await populate(
      DonateRequest.find({ ownerId: req.user._id }).sort({ createdAt: -1 })
    ).lean();
    return success(res, 'Your donation requests', { requests: rows.map(mapRequest) });
  } catch (err) {
    logger.error(`List donate requests error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

const adminList = async (req, res) => {
  try {
    const filter = {};
    const status = String(req.query.status || '').trim();
    if (['pending', 'approved', 'rejected'].includes(status)) filter.status = status;
    const rows = await populate(DonateRequest.find(filter).sort({ createdAt: -1 })).lean();
    return success(res, 'Donate requests', { requests: rows.map(mapRequest) });
  } catch (err) {
    logger.error(`Admin list donate requests error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

const adminReview = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return errorResponse(res, 'Request not found', 404);
    const status = String(req.body.status || '').trim();
    const rejectReason = String(req.body.rejectReason || '').trim();
    if (!['approved', 'rejected'].includes(status)) {
      return errorResponse(res, 'Choose approve or reject', 400);
    }
    if (status === 'rejected' && !rejectReason) {
      return errorResponse(res, 'Add a reason to reject this donation', 400);
    }
    const request = await DonateRequest.findById(id);
    if (!request) return notFound(res, 'Request not found');
    if (request.status !== 'pending') {
      return errorResponse(res, 'This donation has already been reviewed', 409);
    }
    request.status = status;
    request.rejectReason = status === 'rejected' ? rejectReason.slice(0, 500) : null;
    request.reviewedBy = req.adminMaster ? req.adminMaster._id : null;
    request.reviewedAt = new Date();
    await request.save();
    const row = await populate(DonateRequest.findById(request._id)).lean();
    return success(
      res,
      status === 'approved' ? 'Donation approved' : 'Donation rejected',
      { request: mapRequest(row) }
    );
  } catch (err) {
    logger.error(`Admin review donate request error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

const countPending = () => DonateRequest.countDocuments({ status: 'pending' });

module.exports = {
  uploadImage,
  createRequest,
  listMine,
  adminList,
  adminReview,
  countPending,
};
