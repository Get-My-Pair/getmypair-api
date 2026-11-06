/**
 * CareMyPair problem tiles — Masteradmin CRUD + customer list.
 */
const mongoose = require('mongoose');
const CareServiceProblem = require('../models/careServiceProblem.model');
const { SERVICE_TYPES } = require('../models/careServiceProblem.model');
const { defaultProgressFor, CARE_PROBLEM_PROGRESS } = require('../data/careProblemProgress.seed');
const { success, error: errorResponse, notFound } = require('../utils/response');
const logger = require('../utils/logger');

const DEFAULT_ESTIMATE_DAYS = 7;

const DEFAULTS = {
  // User app shows these service tiles for every article. Category-specific
  // rows stay in Masteradmin and are not returned to the customer app.
  repair: [
    {
      code: 'sole_bottom_construction',
      name: 'Sole & Bottom Construction Repairs',
      description:
        'Complete bottom-up sole restoration, from re-gluing delaminated outsoles and replacing worn heels to full resoles and midsole rebuilds.',
      priceRupees: 236,
      sortOrder: 1,
    },
    {
      code: 'upper_seam_restoration',
      name: 'Upper Material & Seam Restoration',
      description:
        'Full upper and interior restoration to patch tears, fix split seams, rebuild heel linings, and replace damaged panels.',
      priceRupees: 236,
      sortOrder: 2,
    },
    {
      code: 'hardware_fastener',
      name: 'Hardware & Fastener Repairs',
      description:
        'Complete hardware and fastener replacement for eyelets, zippers, straps, buckles, velcro, and snaps.',
      priceRupees: 236,
      sortOrder: 3,
    },
    {
      code: 'fit_structural',
      name: 'Fit & Structural Adjustments',
      description:
        'Fixes squeaks, shaky support inside your shoes, and stretches tight spots for a comfortable fit.',
      priceRupees: 236,
      sortOrder: 4,
    },
  ],
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

function normalizeProgressSteps(raw) {
  const list = Array.isArray(raw) ? raw : [];
  const out = [];
  for (let i = 0; i < list.length; i += 1) {
    const item = list[i];
    const title =
      typeof item === 'string'
        ? String(item).trim()
        : String(item?.title || item?.label || item?.text || '').trim();
    if (!title) continue;
    const subtitle =
      typeof item === 'string' ? '' : String(item?.subtitle || '').trim();
    let sortOrder = Number(item?.sortOrder);
    if (!Number.isFinite(sortOrder)) sortOrder = out.length + 1;
    out.push({ title, subtitle, sortOrder });
  }
  return out;
}

function normalizeEstimateDays(raw, fallbackStepsLen) {
  let n = Number(raw);
  if (!Number.isFinite(n) || n < 1) {
    n = fallbackStepsLen > 0 ? fallbackStepsLen : DEFAULT_ESTIMATE_DAYS;
  }
  return Math.min(60, Math.max(1, Math.round(n)));
}

function progressPayloadFor(doc) {
  const code = doc?.code || '';
  const seeded = defaultProgressFor(doc?.serviceType, code);
  const steps = normalizeProgressSteps(doc?.progressSteps);
  const progressSteps = steps.length ? steps : seeded.progressSteps;
  const estimateDays = normalizeEstimateDays(
    doc?.estimateDays,
    progressSteps.length || seeded.estimateDays
  );
  return { estimateDays, progressSteps };
}

function publicProblem(doc) {
  if (!doc) return null;
  const progress = progressPayloadFor(doc);
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
    estimateDays: progress.estimateDays,
    progressSteps: progress.progressSteps,
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

/** Problems with no category assignment — shown for every article in the user app. */
function serviceLevelFilter(serviceType, { activeOnly = false } = {}) {
  const filter = {
    serviceType,
    $or: [
      { categoryCodes: { $exists: false } },
      { categoryCodes: { $size: 0 } },
    ],
  };
  if (activeOnly) filter.isActive = { $ne: false };
  return filter;
}

/**
 * Ensure the shared service tiles exist (Repair 4, Maintain 4, Wash 3)
 * and backfill progressSteps / estimateDays when missing.
 */
async function ensureDefaults(serviceType) {
  const seeds = DEFAULTS[serviceType] || [];
  if (!seeds.length) return;

  const activeServiceLevel = await CareServiceProblem.countDocuments(
    serviceLevelFilter(serviceType, { activeOnly: true })
  );

  if (activeServiceLevel === 0) {
    const ops = seeds.map((s) => {
      const progress = CARE_PROBLEM_PROGRESS[s.code] || defaultProgressFor(serviceType, s.code);
      return {
        updateOne: {
          filter: { serviceType, code: s.code },
          update: {
            $set: {
              isActive: true,
              categoryCodes: [],
              estimateDays: progress.estimateDays,
              progressSteps: progress.progressSteps,
            },
            $setOnInsert: {
              serviceType,
              code: s.code,
              name: s.name,
              description: s.description,
              priceRupees: s.priceRupees,
              sortOrder: s.sortOrder,
            },
          },
          upsert: true,
        },
      };
    });
    await CareServiceProblem.bulkWrite(ops, { ordered: false });
    return;
  }

  // Backfill progress content for existing service-level problems that have none.
  const missing = await CareServiceProblem.find({
    ...serviceLevelFilter(serviceType),
    $or: [
      { progressSteps: { $exists: false } },
      { progressSteps: { $size: 0 } },
      { estimateDays: { $exists: false } },
      { estimateDays: null },
    ],
  })
    .select('_id code serviceType')
    .lean();

  if (!missing.length) return;

  const ops = missing.map((doc) => {
    const progress = defaultProgressFor(doc.serviceType, doc.code);
    return {
      updateOne: {
        filter: { _id: doc._id },
        update: {
          $set: {
            estimateDays: progress.estimateDays,
            progressSteps: progress.progressSteps,
          },
        },
      },
    };
  });
  await CareServiceProblem.bulkWrite(ops, { ordered: false });
}

const listByServiceType = async (req, res) => {
  try {
    const serviceType = normalizeServiceType(req.params.serviceType || req.query.serviceType);
    if (!SERVICE_TYPES.includes(serviceType)) {
      return errorResponse(res, 'serviceType must be repair, maintenance, or wash', 400);
    }
    await ensureDefaults(serviceType);
    const activeOnly = String(req.query.active || '').trim() === '1';
    // Admin and the user app share the service-problem list (Repair 4,
    // Maintain 4, Wash 3). Category-specific rows are not part of that list.
    const items = await CareServiceProblem.find(
      serviceLevelFilter(serviceType, { activeOnly })
    )
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean();
    return success(res, 'Care service problems', {
      serviceType,
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
      {
        $match: {
          $or: [
            { categoryCodes: { $exists: false } },
            { categoryCodes: { $size: 0 } },
          ],
        },
      },
      {
        $group: {
          _id: '$serviceType',
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $ne: ['$isActive', false] }, 1, 0] } },
        },
      },
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
    const seeded = defaultProgressFor(serviceType, code);
    let progressSteps = normalizeProgressSteps(req.body.progressSteps);
    if (!progressSteps.length) progressSteps = seeded.progressSteps;
    const estimateDays = normalizeEstimateDays(
      req.body.estimateDays,
      progressSteps.length || seeded.estimateDays
    );
    const problem = await CareServiceProblem.create({
      serviceType,
      name,
      description,
      priceRupees,
      sortOrder,
      code,
      categoryCodes,
      estimateDays,
      progressSteps,
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
    if (Object.prototype.hasOwnProperty.call(req.body, 'progressSteps')) {
      const progressSteps = normalizeProgressSteps(req.body.progressSteps);
      if (!progressSteps.length) {
        return errorResponse(res, 'progressSteps must include at least one step', 400);
      }
      $set.progressSteps = progressSteps;
      if (!Object.prototype.hasOwnProperty.call(req.body, 'estimateDays')) {
        $set.estimateDays = normalizeEstimateDays(undefined, progressSteps.length);
      }
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'estimateDays')) {
      const estimateDays = Number(req.body.estimateDays);
      if (!Number.isFinite(estimateDays) || estimateDays < 1) {
        return errorResponse(res, 'estimateDays must be at least 1', 400);
      }
      $set.estimateDays = normalizeEstimateDays(estimateDays, DEFAULT_ESTIMATE_DAYS);
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

/**
 * Customer app: active service problems for Repair / Maintain / Wash.
 * Same list for every footwear article. Category-assigned rows stay in admin.
 */
const listActiveForCustomer = async (req, res) => {
  try {
    const serviceType = normalizeServiceType(req.params.serviceType || req.query.serviceType);
    if (!SERVICE_TYPES.includes(serviceType)) {
      return errorResponse(res, 'serviceType must be repair, maintenance, or wash', 400);
    }
    await ensureDefaults(serviceType);
    const items = await CareServiceProblem.find(serviceLevelFilter(serviceType, { activeOnly: true }))
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean();
    return success(res, 'Care service problems', {
      serviceType,
      items: items.map(publicProblem),
    });
  } catch (err) {
    logger.error(`List customer care problems error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

/**
 * Customer app: progress timeline for one problem (by code or id).
 * Used by "Your Pair's Progress" — estimateDays drives 1 step / day.
 */
const getProgressForCustomer = async (req, res) => {
  try {
    const serviceType = normalizeServiceType(
      req.query.serviceType || req.params.serviceType || ''
    );
    const code = String(req.query.code || req.params.code || '')
      .trim()
      .toLowerCase();
    const id = String(req.query.id || req.params.id || '').trim();

    if (!code && !id) {
      return errorResponse(res, 'code or id is required', 400);
    }

    if (serviceType && SERVICE_TYPES.includes(serviceType)) {
      await ensureDefaults(serviceType);
    } else {
      for (const t of SERVICE_TYPES) await ensureDefaults(t);
    }

    let doc = null;
    if (id && mongoose.Types.ObjectId.isValid(id)) {
      doc = await CareServiceProblem.findById(id).lean();
    }
    if (!doc && code) {
      const filter = { code, isActive: { $ne: false } };
      if (serviceType && SERVICE_TYPES.includes(serviceType)) {
        filter.serviceType = serviceType;
      }
      doc = await CareServiceProblem.findOne(filter).lean();
    }
    if (!doc) return notFound(res, 'Care problem not found');

    const item = publicProblem(doc);
    return success(res, 'Care progress timeline', {
      serviceType: item.serviceType,
      code: item.code,
      name: item.name,
      estimateDays: item.estimateDays,
      progressSteps: item.progressSteps,
      item,
    });
  } catch (err) {
    logger.error(`Get care progress error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

module.exports = {
  overview,
  listByServiceType,
  listActiveForCustomer,
  getProgressForCustomer,
  createProblem,
  updateProblem,
  deleteProblem,
};
