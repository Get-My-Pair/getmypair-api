/**
 * CareMyPair problem tiles — Masteradmin CRUD + customer list.
 */
const mongoose = require('mongoose');
const CareServiceProblem = require('../models/careServiceProblem.model');
const { SERVICE_TYPES } = require('../models/careServiceProblem.model');
const { CATEGORY_REPAIR_SERVICES } = require('../data/categoryRepairServices.seed');
const { success, error: errorResponse, notFound } = require('../utils/response');
const logger = require('../utils/logger');

const DEFAULTS = {
  // Repair tiles are seeded per article category (see CATEGORY_REPAIR_SERVICES).
  repair: [],
  maintenance: [
    {
      code: 'protection_conditioning',
      name: 'Protection & Conditioning',
      description:
        'Protect and revive your footwear with hydrophobic weatherproofing, UV shielding, and deep-leather conditioning to keep your shoes soft, vibrant, and dirt-resistant.',
      priceRupees: 236,
      sortOrder: 1,
    },
    {
      code: 'surface_care_polishing',
      name: 'Preventive Surface Care & Polishing',
      description:
        "Restore your footwear's original shine with material-specific brushing, premium polishing, and precise edge detailing to eliminate buildup and yellowing.",
      priceRupees: 236,
      sortOrder: 2,
    },
    {
      code: 'structural_shape',
      name: 'Structural & Shape Maintenance',
      description:
        'Refresh your shoes inside and out with professional steam reshaping, antimicrobial lining sanitization, and factory-fresh lace care.',
      priceRupees: 236,
      sortOrder: 3,
    },
    {
      code: 'storage_preservation',
      name: 'Storage & Preservation Prep',
      description:
        'Safeguard your footwear from long-term wear with custom sole protection and humidity-controlled seasonal storage prep.',
      priceRupees: 236,
      sortOrder: 4,
    },
  ],
  wash: [
    {
      code: 'exterior_surface_deep_clean',
      name: 'Exterior & Surface Deep Cleaning',
      description:
        'Comprehensive deep cleaning that lifts dirt from uppers, scrubs soles clean, and restores yellowed midsoles across all materials.',
      priceRupees: 236,
      sortOrder: 1,
    },
    {
      code: 'interior_care_sanitization',
      name: 'Interior Care & Sanitization',
      description:
        'Deep interior extraction wash and antibacterial treatment to eliminate trapped sweat, dirt, and odor-causing bacteria.',
      priceRupees: 236,
      sortOrder: 2,
    },
    {
      code: 'detailing_finishing',
      name: 'Detailing & Finishing',
      description:
        'Targeted stain treatment, deep lace soaking, and controlled moisture extraction for a spot-free, safe finish.',
      priceRupees: 236,
      sortOrder: 3,
    },
  ],
};

function normalizeCategoryCodes(raw) {
  if (raw == null) return [];
  const list = Array.isArray(raw) ? raw : String(raw).split(',');
  const out = [];
  const seen = new Set();
  for (const item of list) {
    const code = String(item || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    if (!code || seen.has(code)) continue;
    seen.add(code);
    out.push(code);
  }
  return out;
}

function publicProblem(doc) {
  if (!doc) return null;
  return {
    _id: String(doc._id),
    id: String(doc._id),
    serviceType: doc.serviceType,
    code: doc.code || '',
    name: doc.name || '',
    description: doc.description || '',
    priceRupees: Number(doc.priceRupees) || 0,
    sortOrder: Number(doc.sortOrder) || 0,
    categoryCodes: normalizeCategoryCodes(doc.categoryCodes),
    isActive: doc.isActive !== false,
    createdAt: doc.createdAt || null,
    updatedAt: doc.updatedAt || null,
  };
}

function normalizeServiceType(raw) {
  const t = String(raw || '')
    .trim()
    .toLowerCase();
  if (t === 'maintain' || t === 'maintainmypair') return 'maintenance';
  if (t === 'repairmypair') return 'repair';
  if (t === 'washmypair') return 'wash';
  return t;
}

/**
 * Upsert category-wise RepairMyPair tiles and deactivate legacy generic repair rows.
 */
async function syncCategoryRepairServices() {
  const canonicalCodes = [];

  for (const [categoryCode, services] of Object.entries(CATEGORY_REPAIR_SERVICES)) {
    for (const s of services) {
      canonicalCodes.push(s.code);
      await CareServiceProblem.findOneAndUpdate(
        { serviceType: 'repair', code: s.code },
        {
          $set: {
            serviceType: 'repair',
            code: s.code,
            name: s.name,
            description: s.description,
            priceRupees: s.priceRupees,
            sortOrder: s.sortOrder,
            categoryCodes: [categoryCode],
            isActive: true,
          },
        },
        { upsert: true, new: true }
      );
    }
  }

  // Hide old generic / non-canonical repair tiles so only category lists show.
  await CareServiceProblem.updateMany(
    {
      serviceType: 'repair',
      code: { $nin: canonicalCodes },
    },
    { $set: { isActive: false } }
  );
}

async function ensureDefaults(serviceType) {
  if (serviceType === 'repair') {
    await syncCategoryRepairServices();
    return;
  }

  const count = await CareServiceProblem.countDocuments({ serviceType });
  if (count > 0) return;
  const seeds = DEFAULTS[serviceType] || [];
  if (!seeds.length) return;
  await CareServiceProblem.insertMany(
    seeds.map((s) => ({
      ...s,
      serviceType,
      categoryCodes: [],
      isActive: true,
    }))
  );
}

const listByServiceType = async (req, res) => {
  try {
    const serviceType = normalizeServiceType(req.params.serviceType || req.query.serviceType);
    if (!SERVICE_TYPES.includes(serviceType)) {
      return errorResponse(res, 'serviceType must be repair, maintenance, or wash', 400);
    }
    await ensureDefaults(serviceType);
    const activeOnly = String(req.query.active || '').trim() === '1';
    const categoryRaw = String(
      req.query.category || req.query.articleCategory || req.query.categories || ''
    ).trim();
    const categories = normalizeCategoryCodes(categoryRaw);
    const filter = { serviceType };
    if (activeOnly) filter.isActive = { $ne: false };
    // Boot → boot services; sandal → sandal services; empty categoryCodes = all.
    if (categories.length === 1) {
      filter.$or = [
        { categoryCodes: { $exists: false } },
        { categoryCodes: { $size: 0 } },
        { categoryCodes: categories[0] },
      ];
    } else if (categories.length > 1) {
      filter.$or = [
        { categoryCodes: { $exists: false } },
        { categoryCodes: { $size: 0 } },
        { categoryCodes: { $in: categories } },
      ];
    }
    const items = await CareServiceProblem.find(filter)
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean();
    return success(res, 'Care service problems', {
      serviceType,
      category: categories[0] || null,
      categories,
      items: items.map(publicProblem),
    });
  } catch (err) {
    logger.error(`List care problems error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

/** Overview counts for the 3 CareMyPair cards. */
const overview = async (req, res) => {
  try {
    for (const t of SERVICE_TYPES) {
      await ensureDefaults(t);
    }
    const rows = await CareServiceProblem.aggregate([
      { $group: { _id: '$serviceType', total: { $sum: 1 }, active: { $sum: { $cond: [{ $ne: ['$isActive', false] }, 1, 0] } } } },
    ]);
    const byType = Object.fromEntries(rows.map((r) => [r._id, r]));
    const services = SERVICE_TYPES.map((serviceType) => ({
      serviceType,
      label:
        serviceType === 'repair'
          ? 'RepairMyPair'
          : serviceType === 'maintenance'
            ? 'MaintainMyPair'
            : 'WashMyPair',
      total: byType[serviceType]?.total || 0,
      active: byType[serviceType]?.active || 0,
    }));
    return success(res, 'CareMyPair overview', { services });
  } catch (err) {
    logger.error(`Care overview error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

const createProblem = async (req, res) => {
  try {
    const serviceType = normalizeServiceType(req.body.serviceType || req.params.serviceType);
    if (!SERVICE_TYPES.includes(serviceType)) {
      return errorResponse(res, 'serviceType must be repair, maintenance, or wash', 400);
    }
    const name = String(req.body.name || '').trim();
    if (!name) return errorResponse(res, 'Problem name is required', 400);
    const description = String(req.body.description || '').trim();
    let priceRupees = Number(req.body.priceRupees);
    if (!Number.isFinite(priceRupees) || priceRupees < 0) {
      return errorResponse(res, 'priceRupees must be a non-negative number', 400);
    }
    let sortOrder = Number(req.body.sortOrder);
    if (!Number.isFinite(sortOrder)) {
      const last = await CareServiceProblem.findOne({ serviceType })
        .sort({ sortOrder: -1 })
        .select('sortOrder')
        .lean();
      sortOrder = (last?.sortOrder || 0) + 1;
    }
    const code = String(req.body.code || '').trim();
    const categoryCodes = normalizeCategoryCodes(req.body.categoryCodes);
    const problem = await CareServiceProblem.create({
      serviceType,
      name,
      description,
      priceRupees,
      sortOrder,
      code,
      categoryCodes,
      isActive: req.body.isActive === false || req.body.isActive === 'false' ? false : true,
      updatedBy: req.adminMaster?._id || null,
    });
    return success(res, 'Problem created', { item: publicProblem(problem.toObject()) }, 201);
  } catch (err) {
    logger.error(`Create care problem error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

const updateProblem = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return errorResponse(res, 'Invalid id', 400);
    const $set = { updatedBy: req.adminMaster?._id || null };
    if (Object.prototype.hasOwnProperty.call(req.body, 'name')) {
      const name = String(req.body.name || '').trim();
      if (!name) return errorResponse(res, 'Problem name is required', 400);
      $set.name = name;
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'description')) {
      $set.description = String(req.body.description || '').trim();
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'priceRupees')) {
      const priceRupees = Number(req.body.priceRupees);
      if (!Number.isFinite(priceRupees) || priceRupees < 0) {
        return errorResponse(res, 'priceRupees must be a non-negative number', 400);
      }
      $set.priceRupees = priceRupees;
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'sortOrder')) {
      const sortOrder = Number(req.body.sortOrder);
      if (!Number.isFinite(sortOrder)) return errorResponse(res, 'sortOrder must be a number', 400);
      $set.sortOrder = sortOrder;
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'code')) {
      $set.code = String(req.body.code || '').trim();
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'categoryCodes')) {
      $set.categoryCodes = normalizeCategoryCodes(req.body.categoryCodes);
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'isActive')) {
      $set.isActive = !(req.body.isActive === false || req.body.isActive === 'false');
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'serviceType')) {
      const serviceType = normalizeServiceType(req.body.serviceType);
      if (!SERVICE_TYPES.includes(serviceType)) {
        return errorResponse(res, 'Invalid serviceType', 400);
      }
      $set.serviceType = serviceType;
    }
    const problem = await CareServiceProblem.findByIdAndUpdate(id, { $set }, { new: true }).lean();
    if (!problem) return notFound(res, 'Problem not found');
    return success(res, 'Problem updated', { item: publicProblem(problem) });
  } catch (err) {
    logger.error(`Update care problem error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

const deleteProblem = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return errorResponse(res, 'Invalid id', 400);
    const problem = await CareServiceProblem.findByIdAndDelete(id).lean();
    if (!problem) return notFound(res, 'Problem not found');
    return success(res, 'Problem deleted', { item: publicProblem(problem) });
  } catch (err) {
    logger.error(`Delete care problem error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

/** Customer app: active problems for one CareMyPair service. */
const listActiveForCustomer = async (req, res) => {
  req.query = { ...(req.query || {}), active: '1' };
  return listByServiceType(req, res);
};

module.exports = {
  overview,
  listByServiceType,
  listActiveForCustomer,
  createProblem,
  updateProblem,
  deleteProblem,
};
