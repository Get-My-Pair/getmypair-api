/**
 * MongoDB maintenance for Master admin.
 * Preserves portal profiles + masteradmin dynamic config; clears transactional data.
 */

const AdminMaster = require('../models/adminMaster.model');
const AdminProfile = require('../models/adminProfile.model');
const User = require('../models/user.model');
const UserProfile = require('../models/userProfile.model');
const Role = require('../models/role.model');
const Session = require('../models/session.model');
const OTP = require('../models/otp.model');
const Article = require('../models/article.model');
const ArticleCategory = require('../models/articleCategory.model');
const { ServiceRequest } = require('../models/serviceRequest.model');
const CobblerProfile = require('../models/cobblerProfile.model');
const DeliveryProfile = require('../models/deliveryProfile.model');
const Job = require('../models/job.model');
const Payment = require('../models/payment.model');
const Settlement = require('../models/settlement.model');
const Commission = require('../models/commission.model');
const Refund = require('../models/refund.model');
const Invoice = require('../models/invoice.model');
const Revenue = require('../models/revenue.model');
const PaymentAudit = require('../models/paymentAudit.model');
const WebhookLog = require('../models/webhookLog.model');
const UserNotification = require('../models/userNotification.model');
const AuditLog = require('../models/auditLog.model');
const CareServiceProblem = require('../models/careServiceProblem.model');
const HubSettings = require('../models/hubSettings.model');
const SequenceCounter = require('../models/sequenceCounter.model');
const SellListing = require('../models/sellListing.model');
const TrustedDevice = require('../models/trustedDevice.model');
const logger = require('../utils/logger');

/**
 * Never cleared by Clear / Clear all:
 * - adminmasters → masteradmin + repairshop + delivery portal logins/profiles
 * - deliveryprofiles → delivery partner profiles
 * - careserviceproblems / hubsettings / articlecategories → masteradmin dynamic content
 * - roles → auth role reference (needed after reset)
 * - sequencecounters → ID sequences for public order codes
 */
const PROTECTED_COLLECTIONS = new Set([
  'adminmasters',
  'deliveryprofiles',
  'careserviceproblems',
  'hubsettings',
  'articlecategories',
  'roles',
  'sequencecounters',
]);

/** Logical groups for bulk delete (clearable members only) */
const COLLECTION_GROUPS = {
  auth: {
    label: 'Users & authentication',
    description: 'Mobile users, sessions, OTPs, and auth audit logs',
    collections: ['users', 'userprofiles', 'sessions', 'otps', 'auditlogs', 'trusteddevices'],
  },
  articles: {
    label: 'Articles (Digital Shoe Passport)',
    description: 'Customer article / shoe records',
    collections: ['articles'],
  },
  services: {
    label: 'Services & jobs',
    description: 'Service requests and cobbler job records',
    collections: ['servicerequests', 'jobs', 'selllistings'],
  },
  cobblers: {
    label: 'Cobbler profiles',
    description: 'Cobbler booth and verification data',
    collections: ['cobblerprofiles'],
  },
  payments: {
    label: 'Payments & finance',
    description: 'Payments, settlements, commissions, refunds, invoices, revenue',
    collections: [
      'payments',
      'settlements',
      'commissions',
      'refunds',
      'invoices',
      'revenues',
      'paymentaudits',
      'webhooklogs',
    ],
  },
  notifications: {
    label: 'User notifications',
    description: 'In-app notification records',
    collections: ['usernotifications'],
  },
  mobileAdmin: {
    label: 'Mobile admin profiles',
    description: 'Admin profiles linked to mobile app users (not portal logins)',
    collections: ['adminprofiles'],
  },
};

const MODEL_REGISTRY = [
  {
    collection: 'adminmasters',
    model: AdminMaster,
    label: 'Portal logins (Masteradmin + Repairshops + Delivery)',
    group: null,
    protected: true,
  },
  {
    collection: 'deliveryprofiles',
    model: DeliveryProfile,
    label: 'Delivery profiles',
    group: null,
    protected: true,
  },
  {
    collection: 'careserviceproblems',
    model: CareServiceProblem,
    label: 'Care My Pair problems (Masteradmin content)',
    group: null,
    protected: true,
  },
  {
    collection: 'hubsettings',
    model: HubSettings,
    label: 'Hub settings (Masteradmin content)',
    group: null,
    protected: true,
  },
  {
    collection: 'articlecategories',
    model: ArticleCategory,
    label: 'Article categories (Masteradmin content)',
    group: null,
    protected: true,
  },
  {
    collection: 'roles',
    model: Role,
    label: 'Roles (system reference)',
    group: null,
    protected: true,
  },
  {
    collection: 'sequencecounters',
    model: SequenceCounter,
    label: 'Sequence counters (order ID codes)',
    group: null,
    protected: true,
  },
  { collection: 'users', model: User, label: 'Users', group: 'auth' },
  { collection: 'userprofiles', model: UserProfile, label: 'User profiles', group: 'auth' },
  { collection: 'sessions', model: Session, label: 'Sessions', group: 'auth' },
  { collection: 'otps', model: OTP, label: 'OTPs', group: 'auth' },
  { collection: 'auditlogs', model: AuditLog, label: 'Audit logs', group: 'auth' },
  { collection: 'trusteddevices', model: TrustedDevice, label: 'Trusted devices', group: 'auth' },
  { collection: 'articles', model: Article, label: 'Articles', group: 'articles' },
  { collection: 'servicerequests', model: ServiceRequest, label: 'Service requests', group: 'services' },
  { collection: 'jobs', model: Job, label: 'Jobs', group: 'services' },
  { collection: 'selllistings', model: SellListing, label: 'Sell listings', group: 'services' },
  { collection: 'cobblerprofiles', model: CobblerProfile, label: 'Cobbler profiles', group: 'cobblers' },
  { collection: 'payments', model: Payment, label: 'Payments', group: 'payments' },
  { collection: 'settlements', model: Settlement, label: 'Settlements', group: 'payments' },
  { collection: 'commissions', model: Commission, label: 'Commissions', group: 'payments' },
  { collection: 'refunds', model: Refund, label: 'Refunds', group: 'payments' },
  { collection: 'invoices', model: Invoice, label: 'Invoices', group: 'payments' },
  { collection: 'revenues', model: Revenue, label: 'Revenue rollups', group: 'payments' },
  { collection: 'paymentaudits', model: PaymentAudit, label: 'Payment audits', group: 'payments' },
  { collection: 'webhooklogs', model: WebhookLog, label: 'Webhook logs', group: 'payments' },
  { collection: 'usernotifications', model: UserNotification, label: 'User notifications', group: 'notifications' },
  { collection: 'adminprofiles', model: AdminProfile, label: 'Mobile admin profiles', group: 'mobileAdmin' },
];

const registryByCollection = new Map(MODEL_REGISTRY.map((e) => [e.collection, e]));

function isProtected(collection) {
  return PROTECTED_COLLECTIONS.has(String(collection || '').toLowerCase());
}

function getEntry(collection) {
  const key = String(collection || '').toLowerCase();
  return registryByCollection.get(key) || null;
}

async function countCollection(entry) {
  try {
    return await entry.model.countDocuments();
  } catch (err) {
    logger.warn(`DB maintenance count failed for ${entry.collection}: ${err.message}`);
    return 0;
  }
}

/**
 * @returns {Promise<object>} overview with per-collection counts and group summaries
 */
async function getOverview() {
  // Parallel counts — sequential scans against Atlas were hanging the UI on "Loading…".
  const collections = await Promise.all(
    MODEL_REGISTRY.map(async (entry) => {
      const count = await countCollection(entry);
      return {
        collection: entry.collection,
        label: entry.label,
        group: entry.group,
        protected: isProtected(entry.collection),
        count,
      };
    })
  );

  const groups = Object.entries(COLLECTION_GROUPS).map(([key, meta]) => {
    const memberCollections = collections.filter((c) => meta.collections.includes(c.collection));
    const totalDocuments = memberCollections.reduce((sum, c) => sum + c.count, 0);
    return {
      key,
      label: meta.label,
      description: meta.description,
      collections: meta.collections,
      totalDocuments,
      members: memberCollections,
    };
  });

  const deletableCollections = collections.filter((c) => !c.protected);
  const totalDeletableDocuments = deletableCollections.reduce((sum, c) => sum + c.count, 0);

  return {
    collections,
    groups,
    protectedCollections: Array.from(PROTECTED_COLLECTIONS),
    preservedNote:
      'Clear all does NOT delete: Masteradmin / Repairshop / Delivery logins (adminmasters), Delivery profiles, Care problems, Hub settings, Article categories, Roles, Sequence counters.',
    totalDeletableDocuments,
    totalCollections: collections.length,
  };
}

async function deleteFromModel(entry) {
  // Wipe via the model's collection handle (bypasses most document middleware).
  try {
    if (entry.model?.collection?.deleteMany) {
      const result = await entry.model.collection.deleteMany({});
      return result.deletedCount || 0;
    }
  } catch (err) {
    logger.warn(
      `Collection deleteMany failed for ${entry.collection}, falling back to model: ${err.message}`
    );
  }
  const result = await entry.model.deleteMany({});
  return result.deletedCount || 0;
}

function normalizePhrase(value) {
  return String(value || '').trim().toUpperCase();
}

/**
 * Delete all documents in a single collection.
 */
async function deleteCollection(collection, confirmPhrase, adminEmail) {
  const entry = getEntry(collection);
  if (!entry) {
    const err = new Error('Unknown collection');
    err.statusCode = 404;
    throw err;
  }
  if (isProtected(entry.collection)) {
    const err = new Error(
      'This collection is protected (portal profiles / Masteradmin content) and cannot be cleared'
    );
    err.statusCode = 403;
    throw err;
  }

  const phrase = normalizePhrase(confirmPhrase);
  const legacy = normalizePhrase(`DELETE ${entry.collection}`);
  if (phrase !== 'CLEAR' && phrase !== legacy) {
    const err = new Error('Confirmation phrase must be exactly: CLEAR');
    err.statusCode = 400;
    throw err;
  }

  const before = await countCollection(entry);
  const deletedCount = await deleteFromModel(entry);
  const after = await countCollection(entry);
  logger.warn('DB maintenance: collection cleared', {
    collection: entry.collection,
    before,
    deletedCount,
    after,
    adminEmail,
  });

  return {
    collection: entry.collection,
    label: entry.label,
    before,
    deletedCount,
    after,
  };
}

/**
 * Delete all documents in a logical group of collections.
 */
async function deleteGroup(groupKey, confirmPhrase, adminEmail) {
  const group = COLLECTION_GROUPS[groupKey];
  if (!group) {
    const err = new Error('Unknown collection group');
    err.statusCode = 404;
    throw err;
  }

  const groupPhrase = normalizePhrase(confirmPhrase);
  const legacyGroup = normalizePhrase(`DELETE GROUP ${groupKey}`);
  if (groupPhrase !== 'CLEAR' && groupPhrase !== legacyGroup) {
    const err = new Error('Confirmation phrase must be exactly: CLEAR');
    err.statusCode = 400;
    throw err;
  }

  const results = [];
  let totalDeleted = 0;

  for (const collectionName of group.collections) {
    const entry = getEntry(collectionName);
    if (!entry || isProtected(entry.collection)) continue;
    const deletedCount = await deleteFromModel(entry);
    totalDeleted += deletedCount;
    results.push({ collection: entry.collection, label: entry.label, deletedCount });
  }

  logger.warn('DB maintenance: group cleared', {
    group: groupKey,
    totalDeleted,
    adminEmail,
  });

  return { group: groupKey, label: group.label, totalDeleted, results };
}

/**
 * Delete all application data except portal profiles + Masteradmin dynamic content.
 */
async function deleteAllData(confirmPhrase, adminEmail) {
  const phrase = normalizePhrase(confirmPhrase);
  if (phrase !== 'CLEAR_ALL' && phrase !== 'DELETE ALL DATA') {
    const err = new Error('Confirmation phrase must be exactly: CLEAR_ALL');
    err.statusCode = 400;
    throw err;
  }

  const results = [];
  let totalDeleted = 0;

  for (const entry of MODEL_REGISTRY) {
    if (isProtected(entry.collection)) continue;
    const before = await countCollection(entry);
    const deletedCount = await deleteFromModel(entry);
    const after = await countCollection(entry);
    totalDeleted += deletedCount;
    results.push({
      collection: entry.collection,
      label: entry.label,
      before,
      deletedCount,
      after,
    });
  }

  logger.warn('DB maintenance: all clearable data wiped (profiles + Masteradmin content preserved)', {
    totalDeleted,
    preservedCollections: Array.from(PROTECTED_COLLECTIONS),
    adminEmail,
  });

  return {
    totalDeleted,
    preservedCollections: Array.from(PROTECTED_COLLECTIONS),
    results,
  };
}

module.exports = {
  COLLECTION_GROUPS,
  PROTECTED_COLLECTIONS,
  getOverview,
  deleteCollection,
  deleteGroup,
  deleteAllData,
  isProtected,
};
