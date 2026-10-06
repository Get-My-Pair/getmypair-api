const mongoose = require('mongoose');
const SellListing = require('../models/sellListing.model');
const Article = require('../models/article.model');
const { success, error: errorResponse, notFound } = require('../utils/response');
const logger = require('../utils/logger');
const { uploadToCloudinary } = require('../config/cloudinary');
const { proofKeys } = require('../validations/sellListing.validation');

const mapArticle = (article) => {
  if (!article || !article._id) return null;
  return {
    _id: article._id,
    brand: article.brand,
    model: article.model,
    category: article.category,
    color: article.color,
    images: article.images || [],
    shoeSize: article.shoeSize || null,
    footwearType: article.footwearType || 'everyday',
    condition: article.condition || '',
  };
};

const mapOwner = (owner) => {
  if (!owner || !owner._id) return null;
  return {
    _id: owner._id,
    name: owner.name || '',
    mobile: owner.mobile || '',
  };
};

const mapListing = (row) => {
  const article = row.articleId && row.articleId._id ? row.articleId : null;
  const owner = row.ownerId && row.ownerId._id ? row.ownerId : null;
  return {
    _id: row._id,
    articleId: article ? article._id : row.articleId,
    ownerId: owner ? owner._id : row.ownerId,
    footwearType: row.footwearType,
    originalRetailPrice: row.originalRetailPrice,
    conditionGrade: row.conditionGrade,
    proofs: row.proofs || {},
    basePrice: row.basePrice,
    auctionStartDate: row.auctionStartDate,
    auctionEndDate: row.auctionEndDate,
    status: row.status,
    rejectReason: row.rejectReason || null,
    reviewedAt: row.reviewedAt || null,
    createdAt: row.createdAt,
    article: mapArticle(article),
    owner: mapOwner(owner),
  };
};

const populateQuery = (query) =>
  query
    .populate('articleId', 'brand model category color images shoeSize footwearType condition')
    .populate('ownerId', 'name mobile');

/**
 * POST /api/sell/upload-proof
 */
const uploadProof = async (req, res) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'No file uploaded', 400);
    }
    const proofType = String(req.body.proofType || req.query.proofType || '').trim();
    if (!proofKeys.includes(proofType)) {
      return errorResponse(res, 'Invalid proof type', 400);
    }

    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'getmypair/sell-proofs',
      public_id: `sell-${req.user._id}-${proofType}-${Date.now()}`,
      resource_type: 'image',
      transformation: [{ width: 1600, height: 1600, crop: 'limit', quality: 'auto' }],
    });

    return success(res, 'Proof uploaded', {
      imageUrl: result.secure_url,
      proofType,
    });
  } catch (err) {
    logger.error(`Upload sell proof error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

/**
 * POST /api/sell/listings
 */
const createListing = async (req, res) => {
  try {
    const ownerId = req.user._id;
    const {
      articleId,
      footwearType,
      originalRetailPrice,
      conditionGrade,
      proofs,
      basePrice,
      auctionStartDate,
      auctionEndDate,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(articleId)) {
      return errorResponse(res, 'A valid article is required', 400);
    }

    const article = await Article.findOne({ _id: articleId, ownerId }).lean();
    if (!article) {
      return notFound(res, 'Article not found');
    }

    const articleType = article.footwearType === 'luxury' ? 'luxury' : 'everyday';
    if (articleType !== footwearType) {
      return errorResponse(
        res,
        'This footwear does not match the selected Luxury or Everyday list',
        400
      );
    }

    const active = await SellListing.findOne({
      articleId,
      ownerId,
      status: { $in: ['pending', 'approved'] },
    }).lean();
    if (active) {
      return errorResponse(res, 'This footwear already has an active sell request', 409);
    }

    const listing = await SellListing.create({
      ownerId,
      articleId,
      footwearType,
      originalRetailPrice: Number(originalRetailPrice),
      conditionGrade,
      proofs: {
        receipt: proofs.receipt,
        purchaseEmail: proofs.purchaseEmail,
        authenticityCard: proofs.authenticityCard,
        boxLabel: proofs.boxLabel,
      },
      basePrice: Number(basePrice),
      auctionStartDate: new Date(auctionStartDate),
      auctionEndDate: new Date(auctionEndDate),
      status: 'pending',
    });

    const saved = await populateQuery(SellListing.findById(listing._id)).lean();
    logger.info(`Sell listing created: ${listing._id} for article ${articleId}`);
    return success(res, 'Submitted for authenticity review', { listing: mapListing(saved) }, 201);
  } catch (err) {
    logger.error(`Create sell listing error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

/**
 * GET /api/sell/listings?footwearType=luxury|everyday
 * Newest request per article, so the rack shows the current review colour.
 */
const listMine = async (req, res) => {
  try {
    const ownerId = req.user._id;
    const filter = { ownerId };
    const type = String(req.query.footwearType || '').trim();
    if (type === 'luxury' || type === 'everyday') {
      filter.footwearType = type;
    }

    const rows = await populateQuery(SellListing.find(filter).sort({ createdAt: -1 })).lean();
    const seen = new Set();
    const listings = [];
    for (const row of rows) {
      const key = String(row.articleId && row.articleId._id ? row.articleId._id : row.articleId);
      if (seen.has(key)) continue;
      seen.add(key);
      listings.push(mapListing(row));
    }
    return success(res, 'Sell listings retrieved', { listings });
  } catch (err) {
    logger.error(`List sell listings error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

/**
 * GET /api/masteradmin/sell-listings
 */
const adminList = async (req, res) => {
  try {
    const filter = {};
    const status = String(req.query.status || '').trim();
    const type = String(req.query.footwearType || '').trim();
    if (['pending', 'approved', 'rejected'].includes(status)) filter.status = status;
    if (type === 'luxury' || type === 'everyday') filter.footwearType = type;

    const rows = await populateQuery(SellListing.find(filter).sort({ createdAt: -1 })).lean();
    return success(res, 'Sell listings retrieved', {
      listings: rows.map(mapListing),
    });
  } catch (err) {
    logger.error(`Admin list sell listings error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

/**
 * GET /api/masteradmin/sell-listings/:id
 */
const adminGet = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 'Listing not found', 404);
    }
    const row = await populateQuery(SellListing.findById(id)).lean();
    if (!row) return notFound(res, 'Listing not found');
    return success(res, 'Sell listing retrieved', { listing: mapListing(row) });
  } catch (err) {
    logger.error(`Admin get sell listing error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

/**
 * PATCH /api/masteradmin/sell-listings/:id/review
 * Body: { status: 'approved' | 'rejected', rejectReason? }
 */
const adminReview = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 'Listing not found', 404);
    }
    const status = String(req.body.status || '').trim();
    const rejectReason = String(req.body.rejectReason || '').trim();
    if (!['approved', 'rejected'].includes(status)) {
      return errorResponse(res, 'Choose approve or reject', 400);
    }
    if (status === 'rejected' && !rejectReason) {
      return errorResponse(res, 'Add a reason to reject this request', 400);
    }
    if (rejectReason.length > 500) {
      return errorResponse(res, 'Reject reason must be at most 500 characters', 400);
    }

    const listing = await SellListing.findById(id);
    if (!listing) return notFound(res, 'Listing not found');
    if (listing.status !== 'pending') {
      return errorResponse(res, 'This request has already been reviewed', 409);
    }

    listing.status = status;
    listing.rejectReason = status === 'rejected' ? rejectReason : null;
    listing.reviewedBy = req.adminMaster ? req.adminMaster._id : null;
    listing.reviewedAt = new Date();
    await listing.save();

    const row = await populateQuery(SellListing.findById(listing._id)).lean();
    logger.info(`Sell listing ${id} ${status} by ${req.adminMaster && req.adminMaster.email}`);
    return success(
      res,
      status === 'approved' ? 'Request approved' : 'Request rejected',
      { listing: mapListing(row) }
    );
  } catch (err) {
    logger.error(`Admin review sell listing error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

const countPending = () => SellListing.countDocuments({ status: 'pending' });

module.exports = {
  uploadProof,
  createListing,
  listMine,
  adminList,
  adminGet,
  adminReview,
  countPending,
};
