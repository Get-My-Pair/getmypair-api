/**
 * Article category CRUD (Masteradmin) + active list for user app.
 */
const mongoose = require('mongoose');
const ArticleCategory = require('../models/articleCategory.model');
const { success, error: errorResponse, notFound } = require('../utils/response');
const logger = require('../utils/logger');

/** Canonical Article DB category list (Masteradmin + user app). */
const DEFAULT_CATEGORIES = [
  { code: 'formal_shoes', label: 'Formal Shoes', sortOrder: 1 },
  { code: 'casual_shoes', label: 'Casual Shoes', sortOrder: 2 },
  { code: 'sports_shoes', label: 'Sports Shoes', sortOrder: 3 },
  { code: 'safety_shoes', label: 'Safety Shoes', sortOrder: 4 },
  { code: 'leather_sandals', label: 'Leather Sandals', sortOrder: 5 },
  { code: 'flip_flops', label: 'Flip Flops', sortOrder: 6 },
  { code: 'womens_heels', label: "Women's Heels", sortOrder: 7 },
  { code: 'boots', label: 'Boots', sortOrder: 8 },
  { code: 'childrens_shoes', label: "Children's Shoes", sortOrder: 9 },
  { code: 'orthopedic_shoes', label: 'Orthopedic Shoes', sortOrder: 10 },
  { code: 'traditional_footwear', label: 'Traditional Footwear', sortOrder: 11 },
];

function slugifyCode(raw) {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64);
}

function publicCategory(doc) {
  if (!doc) return null;
  return {
    _id: String(doc._id),
    id: String(doc._id),
    code: doc.code || '',
    label: doc.label || '',
    sortOrder: Number(doc.sortOrder) || 0,
    isActive: doc.isActive !== false,
    createdAt: doc.createdAt || null,
    updatedAt: doc.updatedAt || null,
  };
}

/**
 * Upsert the canonical category list and deactivate any codes not in it.
 * Safe to call on every list/overview — keeps DB aligned with product list.
 */
async function ensureDefaults() {
  const canonicalCodes = DEFAULT_CATEGORIES.map((c) => c.code);

  for (const c of DEFAULT_CATEGORIES) {
    await ArticleCategory.findOneAndUpdate(
      { code: c.code },
      {
        $set: {
          label: c.label,
          sortOrder: c.sortOrder,
          isActive: true,
        },
        $setOnInsert: { code: c.code },
      },
      { upsert: true, new: true }
    );
  }

  // Hide old/extra categories so user app only shows the product list.
  await ArticleCategory.updateMany(
    { code: { $nin: canonicalCodes } },
    { $set: { isActive: false } }
  );
}

const overview = async (req, res) => {
  try {
    await ensureDefaults();
    const [total, active] = await Promise.all([
      ArticleCategory.countDocuments(),
      ArticleCategory.countDocuments({ isActive: { $ne: false } }),
    ]);
    return success(res, 'Article DB overview', {
      cards: [
        {
          key: 'categories',
          label: 'Category',
          blurb: 'Footwear categories for add-article and CareMyPair service mapping.',
          total,
          active,
        },
      ],
    });
  } catch (err) {
    logger.error(`Article category overview error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

const listCategories = async (req, res) => {
  try {
    await ensureDefaults();
    const activeOnly = String(req.query.active || '').trim() === '1';
    const filter = {};
    if (activeOnly) filter.isActive = { $ne: false };
    const items = await ArticleCategory.find(filter)
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean();
    return success(res, 'Article categories', {
      items: items.map(publicCategory),
    });
  } catch (err) {
    logger.error(`List article categories error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

const listActiveForCustomer = async (req, res) => {
  req.query = { ...(req.query || {}), active: '1' };
  return listCategories(req, res);
};

const createCategory = async (req, res) => {
  try {
    const label = String(req.body.label || '').trim();
    if (!label) return errorResponse(res, 'Category label is required', 400);

    let code = slugifyCode(req.body.code || label);
    if (!code) return errorResponse(res, 'Category code is required', 400);

    const existing = await ArticleCategory.findOne({ code }).lean();
    if (existing) {
      return errorResponse(res, `Category code "${code}" already exists`, 409);
    }

    let sortOrder = Number(req.body.sortOrder);
    if (!Number.isFinite(sortOrder)) {
      const last = await ArticleCategory.findOne()
        .sort({ sortOrder: -1 })
        .select('sortOrder')
        .lean();
      sortOrder = (last?.sortOrder || 0) + 1;
    }

    const item = await ArticleCategory.create({
      code,
      label,
      sortOrder,
      isActive: req.body.isActive === false || req.body.isActive === 'false' ? false : true,
      updatedBy: req.adminMaster?._id || null,
    });

    return success(res, 'Category created', { item: publicCategory(item.toObject()) }, 201);
  } catch (err) {
    if (err && err.code === 11000) {
      return errorResponse(res, 'Category code already exists', 409);
    }
    logger.error(`Create article category error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return errorResponse(res, 'Invalid id', 400);

    const $set = { updatedBy: req.adminMaster?._id || null };

    if (Object.prototype.hasOwnProperty.call(req.body, 'label')) {
      const label = String(req.body.label || '').trim();
      if (!label) return errorResponse(res, 'Category label is required', 400);
      $set.label = label;
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'code')) {
      const code = slugifyCode(req.body.code);
      if (!code) return errorResponse(res, 'Category code is required', 400);
      const clash = await ArticleCategory.findOne({
        code,
        _id: { $ne: id },
      }).lean();
      if (clash) return errorResponse(res, `Category code "${code}" already exists`, 409);
      $set.code = code;
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'sortOrder')) {
      const sortOrder = Number(req.body.sortOrder);
      if (!Number.isFinite(sortOrder)) {
        return errorResponse(res, 'sortOrder must be a number', 400);
      }
      $set.sortOrder = sortOrder;
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'isActive')) {
      $set.isActive = !(req.body.isActive === false || req.body.isActive === 'false');
    }

    const item = await ArticleCategory.findByIdAndUpdate(id, { $set }, { new: true }).lean();
    if (!item) return notFound(res, 'Category not found');
    return success(res, 'Category updated', { item: publicCategory(item) });
  } catch (err) {
    if (err && err.code === 11000) {
      return errorResponse(res, 'Category code already exists', 409);
    }
    logger.error(`Update article category error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return errorResponse(res, 'Invalid id', 400);
    const item = await ArticleCategory.findByIdAndDelete(id).lean();
    if (!item) return notFound(res, 'Category not found');
    return success(res, 'Category deleted', { item: publicCategory(item) });
  } catch (err) {
    logger.error(`Delete article category error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

/** Resolve whether a category code is allowed for article create/update. */
async function isValidCategoryCode(code) {
  const normalized = slugifyCode(code);
  if (!normalized) return false;
  await ensureDefaults();
  const found = await ArticleCategory.findOne({
    code: normalized,
    isActive: { $ne: false },
  })
    .select('_id')
    .lean();
  return Boolean(found);
}

module.exports = {
  overview,
  listCategories,
  listActiveForCustomer,
  createCategory,
  updateCategory,
  deleteCategory,
  ensureDefaults,
  isValidCategoryCode,
  slugifyCode,
  publicCategory,
};
