/**
 * MongoDB maintenance for Darkworkstore master admin.
 * Never deletes adminmasters (Darkworkstore login credentials).
 */

const AdminMaster = require('../models/adminMaster.model');
const AdminProfile = require('../models/adminProfile.model');
const User = require('../models/user.model');
const UserProfile = require('../models/userProfile.model');
const Role = require('../models/role.model');
const Session = require('../models/session.model');
const OTP = require('../models/otp.model');
const Article = require('../models/article.model');
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
const logger = require('../utils/logger');

/** Collections that must never be cleared via maintenance UI */
const PROTECTED_COLLECTIONS = new Set(['adminmasters']);

/** Logical groups for bulk delete */
const COLLECTION_GROUPS = {
  auth: {
    label: 'Users & authentication',
    description: 'Mobile users, sessions, OTPs, and auth audit logs',
    collections: ['users', 'userprofiles', 'sessions', 'otps', 'auditlogs'],
  },
  articles: {
    label: 'Articles (Digital Shoe Passport)',
    description: 'Customer article / shoe records',
    collections: ['articles'],
  },
  services: {
    label: 'Services & jobs',
    description: 'Service requests and cobbler job records',
    collections: ['servicerequests', 'jobs'],
  },
  cobblers: {
    label: 'Cobbler profiles',
    description: 'Cobbler booth and verification data',
    collections: ['cobblerprofiles'],
  },
  delivery: {
    label: 'Delivery partners',
    description: 'Delivery partner profiles',
    collections: ['deliveryprofiles'],
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
    description: 'Admin profiles linked to mobile app users (not Darkworkstore login)',
    collections: ['adminprofiles'],
  },
  roles: {
    label: 'Roles (reference)',
    description: 'USER, COBBER, DELIVERY, ADMIN role documents — re-seed may be needed',
    collections: ['roles'],
  },
};

const MODEL_REGISTRY = [
  { collection: 'adminmasters', model: AdminMaster, label: 'Master admins (Darkworkstore login)', group: null, protected: true },
  { collection: 'users', model: User, label: 'Users', group: 'auth' },
  { collection: 'userprofiles', model: UserProfile, label: 'User profiles', group: 'auth' },
  { collection: 'sessions', model: Session, label: 'Sessions', group: 'auth' },
  { collection: 'otps', model: OTP, label: 'OTPs', group: 'auth' },
  { collection: 'auditlogs', model: AuditLog, label: 'Audit logs', group: 'auth' },
  { collection: 'roles', model: Role, label: 'Roles', group: 'roles' },
  { collection: 'articles', model: Article, label: 'Articles', group: 'articles' },
  { collection: 'servicerequests', model: ServiceRequest, label: 'Service requests', group: 'services' },
  { collection: 'jobs', model: Job, label: 'Jobs', group: 'services' },
  { collection: 'cobblerprofiles', model: CobblerProfile, label: 'Cobbler profiles', group: 'cobblers' },
  { collection: 'deliveryprofiles', model: DeliveryProfile, label: 'Delivery profiles', group: 'delivery' },
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

function assertConfirmPhrase(confirmPhrase, expected) {
  if (String(confirmPhrase || '').trim() !== expected) {
    const err = new Error(`Confirmation phrase must be exactly: ${expected}`);
    err.statusCode = 400;
    throw err;
  }
}

async function countCollection(entry) {
  return entry.model.countDocuments();
}

/**
 * @returns {Promise<object>} overview with per-collection counts and group summaries
 */
async function getOverview() {
  const collections = [];
  for (const entry of MODEL_REGISTRY) {
    const count = await countCollection(entry);
    collections.push({
      collection: entry.collection,
      label: entry.label,
      group: entry.group,
      protected: isProtected(entry.collection),
      count,
    });
  }

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
    totalDeletableDocuments,
    totalCollections: collections.length,
  };
}

async function deleteFromModel(entry) {
  const result = await entry.model.deleteMany({});
  return result.deletedCount || 0;
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
    const err = new Error('This collection is protected and cannot be cleared');
    err.statusCode = 403;
    throw err;
  }

  assertConfirmPhrase(confirmPhrase, `DELETE ${entry.collection}`);

  const deletedCount = await deleteFromModel(entry);
  logger.warn('DB maintenance: collection cleared', {
    collection: entry.collection,
    deletedCount,
    adminEmail,
  });

  return { collection: entry.collection, label: entry.label, deletedCount };
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

  assertConfirmPhrase(confirmPhrase, `DELETE GROUP ${groupKey}`);

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
 * Delete all application data except master admin login (adminmasters).
 */
async function deleteAllData(confirmPhrase, adminEmail) {
  assertConfirmPhrase(confirmPhrase, 'DELETE ALL DATA');

  const results = [];
  let totalDeleted = 0;

  for (const entry of MODEL_REGISTRY) {
    if (isProtected(entry.collection)) continue;
    const deletedCount = await deleteFromModel(entry);
    totalDeleted += deletedCount;
    results.push({ collection: entry.collection, label: entry.label, deletedCount });
  }

  logger.warn('DB maintenance: all data cleared (adminmasters preserved)', {
    totalDeleted,
    adminEmail,
  });

  return { totalDeleted, preservedCollections: Array.from(PROTECTED_COLLECTIONS), results };
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
