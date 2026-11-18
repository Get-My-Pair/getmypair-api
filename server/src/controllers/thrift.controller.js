const mongoose = require('mongoose');
const ThriftProduct = require('../models/thriftProduct.model');
const { CATEGORIES, GENDERS, CONDITIONS } = require('../models/thriftProduct.model');
const ThriftOrder = require('../models/thriftOrder.model');
const { success, error: errorResponse, notFound } = require('../utils/response');
const { uploadToCloudinary } = require('../config/cloudinary');
const paymentService = require('../services/payment.service');
const logger = require('../utils/logger');

const MAX_IMAGE_BYTES = 2.2 * 1024 * 1024;

function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function pickEnum(value, allowed, fallback) {
  const key = String(value || '').trim().toLowerCase();
  return allowed.includes(key) ? key : fallback;
}

async function storeImage(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  const match = raw.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([a-zA-Z0-9+/=\s]+)$/);
  if (!match) {
    const err = new Error('Each photo must be an uploaded image');
    err.statusCode = 400;
    throw err;
  }
  const buffer = Buffer.from(match[2].replace(/\s/g, ''), 'base64');
  if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) {
    const err = new Error('Each photo must be under 2 MB');
    err.statusCode = 400;
    throw err;
  }
  try {
    const uploaded = await uploadToCloudinary(buffer, {
      folder: 'getmypair/thrift',
      resource_type: 'image',
    });
    if (uploaded?.secure_url) return uploaded.secure_url;
  } catch (err) {
    logger.warn(`Thrift image kept locally: ${err.message}`);
  }
  return `data:${match[1]};base64,${match[2].replace(/\s/g, '')}`;
}

async function normalizeImages(list) {
  const incoming = Array.isArray(list) ? list : [];
  const stored = [];
  for (const item of incoming) {
    const url = await storeImage(item);
    if (url) stored.push(url);
    if (stored.length === 4) break;
  }
  if (!stored.length) {
    const err = new Error('Cover photo is required');
    err.statusCode = 400;
    throw err;
  }
  return stored;
}

function mapProduct(row) {
  if (!row) return null;
  const doc = row.toObject ? row.toObject() : row;
  return {
    _id: doc._id,
    title: doc.title,
    brand: doc.brand,
    model: doc.model || '',
    category: doc.category,
    gender: doc.gender,
    color: doc.color || '',
    size: doc.size || '',
    condition: doc.condition,
    description: doc.description || '',
    mrp: doc.mrp || 0,
    price: doc.price,
    officePercent: doc.officePercent,
    discountPercent: doc.discountPercent || 0,
    stock: doc.stock,
    images: doc.images || [],
    isActive: doc.isActive !== false,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function buildProductBody(body, images) {
  const price = num(body.price, 0);
  const mrp = num(body.mrp, 0);
  const officePercent = num(body.officePercent, NaN);
  const title = String(body.title || '').trim();
  const brand = String(body.brand || '').trim();
  if (!title) {
    const err = new Error('Title is required');
    err.statusCode = 400;
    throw err;
  }
  if (!brand) {
    const err = new Error('Brand is required');
    err.statusCode = 400;
    throw err;
  }
  if (price < 1) {
    const err = new Error('Enter a selling price');
    err.statusCode = 400;
    throw err;
  }
  if (!Number.isFinite(officePercent) || officePercent < 0 || officePercent > 100) {
    const err = new Error('Office % must be between 0 and 100');
    err.statusCode = 400;
    throw err;
  }
  return {
    title,
    brand,
    model: String(body.model || '').trim(),
    category: pickEnum(body.category, CATEGORIES, 'sneakers'),
    gender: pickEnum(body.gender, GENDERS, 'unisex'),
    color: String(body.color || '').trim(),
    size: String(body.size || '').trim(),
    condition: pickEnum(body.condition, CONDITIONS, 'good'),
    description: String(body.description || '').trim(),
    mrp: mrp > 0 ? mrp : 0,
    price,
    officePercent,
    stock: Math.max(0, Math.floor(num(body.stock, 1))),
    images,
    isActive: body.isActive !== false && body.isActive !== 'false',
  };
}

const meta = async (_req, res) =>
  success(res, 'Thrift Store options', {
    categories: CATEGORIES,
    genders: GENDERS,
    conditions: CONDITIONS,
  });

const adminList = async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const filter = {};
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ title: rx }, { brand: rx }, { model: rx }, { color: rx }, { size: rx }];
    }
    const rows = await ThriftProduct.find(filter).sort({ createdAt: -1 }).limit(200);
    return success(res, 'Thrift products', { items: rows.map(mapProduct) });
  } catch (err) {
    return errorResponse(res, err.message || 'Could not load products', err.statusCode || 500);
  }
};

const adminCreate = async (req, res) => {
  try {
    const images = await normalizeImages(req.body.images);
    const payload = buildProductBody(req.body, images);
    const row = await ThriftProduct.create(payload);
    return success(res, 'Footwear added to Thrift Store', { item: mapProduct(row) }, 201);
  } catch (err) {
    return errorResponse(res, err.message || 'Could not save product', err.statusCode || 400);
  }
};

const adminUpdate = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return notFound(res, 'Product not found');
    const existing = await ThriftProduct.findById(req.params.id);
    if (!existing) return notFound(res, 'Product not found');
    const images = await normalizeImages(
      req.body.images && req.body.images.length ? req.body.images : existing.images
    );
    const payload = buildProductBody({ ...existing.toObject(), ...req.body, images }, images);
    Object.assign(existing, payload);
    await existing.save();
    return success(res, 'Footwear updated', { item: mapProduct(existing) });
  } catch (err) {
    return errorResponse(res, err.message || 'Could not update product', err.statusCode || 400);
  }
};

const adminRemove = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return notFound(res, 'Product not found');
    const paid = await ThriftOrder.exists({ productId: req.params.id, status: 'paid' });
    if (paid) {
      await ThriftProduct.updateOne({ _id: req.params.id }, { $set: { isActive: false, stock: 0 } });
      return success(res, 'Product hidden. Paid orders keep their record.');
    }
    const removed = await ThriftProduct.findByIdAndDelete(req.params.id);
    if (!removed) return notFound(res, 'Product not found');
    return success(res, 'Product removed');
  } catch (err) {
    return errorResponse(res, err.message || 'Could not remove product', 500);
  }
};

const adminOrders = async (_req, res) => {
  try {
    const rows = await ThriftOrder.find().sort({ createdAt: -1 }).limit(200).lean();
    return success(res, 'Thrift orders', { items: rows });
  } catch (err) {
    return errorResponse(res, err.message || 'Could not load orders', 500);
  }
};

const listProducts = async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const category = String(req.query.category || '').trim().toLowerCase();
    const filter = { isActive: { $ne: false }, stock: { $gt: 0 } };
    if (category && category !== 'all' && CATEGORIES.includes(category)) {
      filter.category = category;
    }
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { title: rx },
        { brand: rx },
        { model: rx },
        { color: rx },
        { size: rx },
        { category: rx },
      ];
    }
    const rows = await ThriftProduct.find(filter).sort({ createdAt: -1 }).limit(80);
    return success(res, 'Thrift Store', { items: rows.map(mapProduct) });
  } catch (err) {
    return errorResponse(res, err.message || 'Could not load store', 500);
  }
};

const getProduct = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return notFound(res, 'Product not found');
    const row = await ThriftProduct.findOne({
      _id: req.params.id,
      isActive: { $ne: false },
    });
    if (!row) return notFound(res, 'Product not found');
    return success(res, 'Product', { item: mapProduct(row) });
  } catch (err) {
    return errorResponse(res, err.message || 'Could not load product', 500);
  }
};

function readAddress(body) {
  const address = body.address || body;
  const fullName = String(address.fullName || '').trim();
  const phone = String(address.phone || '').replace(/\s/g, '');
  const line1 = String(address.line1 || '').trim();
  const city = String(address.city || '').trim();
  const pincode = String(address.pincode || '').trim();
  if (!fullName || !line1 || !city || !pincode) {
    const err = new Error('Name, address, city and pincode are required');
    err.statusCode = 400;
    throw err;
  }
  if (!/^\d{10}$/.test(phone)) {
    const err = new Error('Enter a 10-digit mobile number');
    err.statusCode = 400;
    throw err;
  }
  if (!/^\d{6}$/.test(pincode)) {
    const err = new Error('Enter a 6-digit pincode');
    err.statusCode = 400;
    throw err;
  }
  return {
    fullName,
    phone,
    line1,
    line2: String(address.line2 || '').trim(),
    city,
    pincode,
  };
}

const checkout = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.body.productId)) {
      return errorResponse(res, 'Choose a product', 400);
    }
    const product = await ThriftProduct.findOne({
      _id: req.body.productId,
      isActive: { $ne: false },
    });
    if (!product) return notFound(res, 'This pair is no longer listed');
    const qty = Math.max(1, Math.min(5, Math.floor(num(req.body.qty, 1))));
    if (product.stock < qty) {
      return errorResponse(res, 'Not enough stock for this pair', 400);
    }
    const address = readAddress(req.body);
    const amount = Math.round(product.price * qty * 100) / 100;
    const officeAmount = Math.round(amount * (Number(product.officePercent) || 0)) / 100;
    const order = await ThriftOrder.create({
      userId: req.user._id,
      productId: product._id,
      product: {
        title: product.title,
        brand: product.brand,
        size: product.size || '',
        image: (product.images && product.images[0]) || '',
        price: product.price,
        officePercent: product.officePercent,
      },
      qty,
      amount,
      officePercent: product.officePercent,
      officeAmount,
      address,
      status: 'pending_payment',
    });
    const paymentData = await paymentService.createThriftPaymentLink(
      {
        order,
        userId: req.user._id,
        redirectUrl: req.body.redirectUrl,
        paymentMode: req.body.paymentMode,
      },
      req
    );
    return success(res, 'Checkout ready', { order, ...paymentData });
  } catch (err) {
    return errorResponse(res, err.message || 'Could not start payment', err.statusCode || 500);
  }
};

module.exports = {
  meta,
  adminList,
  adminCreate,
  adminUpdate,
  adminRemove,
  adminOrders,
  listProducts,
  getProduct,
  checkout,
};
