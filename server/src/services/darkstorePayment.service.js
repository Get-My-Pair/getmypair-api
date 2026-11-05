/**
 * Repairshops admin payment operations — cost approval, jobs, revenue, settlements, reports.
 */
const mongoose = require('mongoose');
const Payment = require('../models/payment.model');
const Settlement = require('../models/settlement.model');
const PaymentAudit = require('../models/paymentAudit.model');
const Revenue = require('../models/revenue.model');
const { ServiceRequest } = require('../models/serviceRequest.model');
const User = require('../models/user.model');
const Article = require('../models/article.model');
const paymentNotification = require('./paymentNotification.service');
const { logPaymentAudit } = require('./paymentAudit.service');

function darkStoreFilter(darkStoreId) {
  const base = { darkStoreId: { $exists: true, $ne: null } };
  if (darkStoreId) base.darkStoreId = String(darkStoreId).trim();
  return base;
}

function paginate(page = 1, limit = 20) {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  return { page: p, limit: l, skip: (p - 1) * l };
}

async function enrichServiceRequests(requests) {
  if (!requests.length) return [];
  const userIds = [...new Set(requests.map((r) => String(r.userId)))];
  const articleIds = [...new Set(requests.map((r) => String(r.articleId)))];
  const [users, articles] = await Promise.all([
    User.find({ _id: { $in: userIds } })
      .select('name mobile email')
      .lean(),
    Article.find({ _id: { $in: articleIds } })
      .select('name brand')
      .lean(),
  ]);
  const userMap = Object.fromEntries(users.map((u) => [String(u._id), u]));
  const articleMap = Object.fromEntries(articles.map((a) => [String(a._id), a]));
  return requests.map((r) => ({
    ...r,
    user: userMap[String(r.userId)] || null,
    article: articleMap[String(r.articleId)] || null,
  }));
}

/**
 * Accepted jobs where the store can set / update additional cost.
 * Only in-shop work (or already pending customer cost approval) — not inbox / paid.
 */
async function listCostApprovalJobs({ darkStoreId, page, limit }) {
  const { page: p, limit: l, skip } = paginate(page, limit);
  const filter = {
    ...darkStoreFilter(darkStoreId),
    status: { $nin: ['cancelled', 'completed'] },
    paymentState: { $nin: ['PAYMENT_SUCCESS', 'PAYMENT_REFUNDED'] },
    trackingState: {
      $in: [
        'dark_store_received',
        'inspection_started',
        'repair_in_progress',
        'repair_completed',
        'dispatch_ready',
      ],
    },
    $or: [
      // Needs an additional-cost update (or first actual cost).
      { actualCostUserDecision: { $in: [null, 'pending'] } },
      { paymentState: { $in: ['COST_APPROVAL_PENDING', 'PAYMENT_PENDING', 'PAYMENT_INITIATED'] } },
      { workflowStatus: { $in: ['COBBLER_COST_PENDING', 'COST_APPROVAL_PENDING', 'PAYMENT_PENDING'] } },
      { actualCost: null },
    ],
  };
  const [items, total] = await Promise.all([
    ServiceRequest.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(l).lean(),
    ServiceRequest.countDocuments(filter),
  ]);
  return { items: await enrichServiceRequests(items), total, page: p, limit: l };
}

/** Update actual cost from repairshops (triggers user approval flow). */
async function updateActualCost(serviceRequestId, actualCost, adminId, req) {
  if (!mongoose.Types.ObjectId.isValid(serviceRequestId)) {
    const err = new Error('Invalid service request id');
    err.statusCode = 400;
    throw err;
  }
  const n = Number(actualCost);
  if (!Number.isFinite(n) || n < 0) {
    const err = new Error('actualCost must be a non-negative number');
    err.statusCode = 400;
    throw err;
  }

  const request = await ServiceRequest.findById(serviceRequestId);
  if (!request) {
    const err = new Error('Service request not found');
    err.statusCode = 404;
    throw err;
  }
  if (!request.darkStoreId) {
    const err = new Error('This request is not assigned to a dark store');
    err.statusCode = 400;
    throw err;
  }

  const prev = request.actualCost;
  const baseline =
    prev != null && Number(prev) >= 0
      ? Number(prev)
      : Number(request.estimatedCost) || 0;
  // Only surface additional-charges UI when the repair shop changes the amount.
  if (n === baseline) {
    return { request: request.toObject() };
  }
  request.actualCost = n;
  request.actualCostUserDecision = 'pending';
  request.actualCostAcceptedAt = null;
  request.workflowStatus = 'COBBLER_COST_PENDING';
  request.paymentState = 'COST_APPROVAL_PENDING';
  await request.save();

  await paymentNotification.notifyDarkstoreCostUpdated({
    userId: request.userId,
    serviceRequestId: request._id,
    actualCost: n,
  });

  await logPaymentAudit(
    {
      action: 'darkstore_cost_updated',
      resourceType: 'service_request',
      resourceId: request._id,
      userId: adminId,
      status: 'success',
      details: { previousCost: prev, actualCost: n, darkStoreId: request.darkStoreId },
    },
    req
  );

  return { request: request.toObject() };
}

/** Payment status monitor — all payments for dark store jobs. */
async function listPaymentStatus({ darkStoreId, status, page, limit }) {
  const { page: p, limit: l, skip } = paginate(page, limit);
  const filter = { ...darkStoreFilter(darkStoreId) };
  if (status) filter.status = String(status).toUpperCase();

  const [items, total] = await Promise.all([
    Payment.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(l).lean(),
    Payment.countDocuments(filter),
  ]);

  const srIds = items.map((i) => i.serviceRequestId);
  const requests = await ServiceRequest.find({ _id: { $in: srIds } })
    .select(
      'publicId serviceType trackingState darkStoreId darkStoreName paymentState workflowStatus userId articleId actualCost estimatedCost'
    )
    .lean();
  const enrichedRequests = await enrichServiceRequests(requests);
  const srMap = Object.fromEntries(enrichedRequests.map((r) => [String(r._id), r]));

  const userIds = [...new Set(items.map((i) => String(i.userId || '')).filter(Boolean))];
  const users = userIds.length
    ? await User.find({ _id: { $in: userIds } }).select('name mobile email').lean()
    : [];
  const userMap = Object.fromEntries(users.map((u) => [String(u._id), u]));

  return {
    items: items.map((pay) => {
      const serviceRequest = srMap[String(pay.serviceRequestId)] || null;
      const user = userMap[String(pay.userId)] || serviceRequest?.user || null;
      return {
        ...pay,
        publicId: serviceRequest?.publicId || null,
        serviceRequest,
        user,
        customerName: user?.name || null,
        serviceType: serviceRequest?.serviceType || null,
      };
    }),
    total,
    page: p,
    limit: l,
  };
}

async function getPaymentStatusByOrder(orderId) {
  const payment = await Payment.findOne({ orderId }).lean();
  if (!payment) {
    const err = new Error('Payment not found');
    err.statusCode = 404;
    throw err;
  }
  const request = await ServiceRequest.findById(payment.serviceRequestId).lean();
  const settlements = await Settlement.find({ paymentId: payment._id }).lean();
  return { payment, serviceRequest: request, settlements };
}

/** Paid jobs — dark store service requests with successful payment. */
async function listPaidJobs({ darkStoreId, from, to, page, limit }) {
  const { page: p, limit: l, skip } = paginate(page, limit);
  const filter = {
    ...darkStoreFilter(darkStoreId),
    paymentState: 'PAYMENT_SUCCESS',
  };
  if (from || to) {
    filter.updatedAt = {};
    if (from) filter.updatedAt.$gte = new Date(from);
    if (to) filter.updatedAt.$lte = new Date(to);
  }

  const [items, total] = await Promise.all([
    ServiceRequest.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(l).lean(),
    ServiceRequest.countDocuments(filter),
  ]);

  const enriched = await enrichServiceRequests(items);
  const ids = items.map((i) => i._id);
  const payments = await Payment.find({
    serviceRequestId: { $in: ids },
    status: 'PAYMENT_SUCCESS',
  }).lean();
  const payMap = {};
  payments.forEach((pay) => {
    payMap[String(pay.serviceRequestId)] = pay;
  });

  return {
    items: enriched.map((r) => ({ ...r, payment: payMap[String(r._id)] || null })),
    total,
    page: p,
    limit: l,
  };
}

/** Unpaid jobs — cost approved or pending payment. */
async function listUnpaidJobs({ darkStoreId, page, limit }) {
  const { page: p, limit: l, skip } = paginate(page, limit);
  const filter = {
    ...darkStoreFilter(darkStoreId),
    status: { $ne: 'cancelled' },
    paymentState: { $nin: ['PAYMENT_SUCCESS', 'PAYMENT_REFUNDED'] },
    $or: [
      { actualCost: { $ne: null }, actualCostUserDecision: 'accepted' },
      { workflowStatus: 'PAYMENT_PENDING' },
      { paymentState: { $in: ['PAYMENT_PENDING', 'PAYMENT_INITIATED', 'PAYMENT_FAILED'] } },
    ],
  };

  const [items, total] = await Promise.all([
    ServiceRequest.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(l).lean(),
    ServiceRequest.countDocuments(filter),
  ]);

  const enriched = await enrichServiceRequests(items);
  const ids = items.map((i) => i._id);
  const payments = await Payment.find({ serviceRequestId: { $in: ids } })
    .sort({ createdAt: -1 })
    .lean();
  const payMap = {};
  payments.forEach((pay) => {
    const key = String(pay.serviceRequestId);
    if (!payMap[key]) payMap[key] = pay;
  });

  return {
    items: enriched.map((r) => ({ ...r, payment: payMap[String(r._id)] || null })),
    total,
    page: p,
    limit: l,
  };
}

/** Revenue dashboard metrics for dark store. */
async function getRevenueDashboard({ darkStoreId, from, to }) {
  const match = { ...darkStoreFilter(darkStoreId), status: 'PAYMENT_SUCCESS' };
  if (from || to) {
    match.paidAt = {};
    if (from) match.paidAt.$gte = new Date(from);
    if (to) match.paidAt.$lte = new Date(to);
  }

  const [summary] = await Payment.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$amount' },
        gmpShare: { $sum: '$gmpShare' },
        partnerShare: { $sum: '$cobblerShare' },
        transactionCount: { $sum: 1 },
      },
    },
  ]);

  const byStatus = await Payment.aggregate([
    { $match: darkStoreFilter(darkStoreId) },
    { $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$amount' } } },
  ]);

  const pendingSettlements = await Settlement.aggregate([
    {
      $match: {
        beneficiaryType: 'dark_store',
        status: { $in: ['pending', 'processing'] },
        ...(darkStoreId ? { beneficiaryId: String(darkStoreId) } : {}),
      },
    },
    { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: '$amount' } } },
  ]);

  const dailyRevenue = await Payment.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$paidAt' } },
        revenue: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: -1 } },
    { $limit: 14 },
  ]);

  return {
    summary: summary || {
      totalRevenue: 0,
      gmpShare: 0,
      partnerShare: 0,
      transactionCount: 0,
    },
    byStatus,
    pendingSettlements: pendingSettlements[0] || { count: 0, amount: 0 },
    dailyRevenue: dailyRevenue.reverse(),
  };
}

/** Transaction list with optional filters. */
async function listTransactions({ darkStoreId, status, from, to, page, limit }) {
  return listPaymentStatus({ darkStoreId, status, page, limit, from, to });
}

async function getTransactionDetails(paymentId) {
  const filter = mongoose.Types.ObjectId.isValid(paymentId)
    ? { _id: paymentId }
    : { orderId: paymentId };
  const payment = await Payment.findOne(filter).lean();
  if (!payment) {
    const err = new Error('Payment not found');
    err.statusCode = 404;
    throw err;
  }
  const [request, user, settlements, audits] = await Promise.all([
    ServiceRequest.findById(payment.serviceRequestId).lean(),
    User.findById(payment.userId).select('name mobile email').lean(),
    Settlement.find({ paymentId: payment._id }).lean(),
    PaymentAudit.find({
      $or: [
        { resourceId: String(payment._id) },
        { resourceId: String(payment.serviceRequestId) },
      ],
    })
      .sort({ timestamp: -1 })
      .limit(20)
      .lean(),
  ]);
  return { payment, serviceRequest: request, user, settlements, audits };
}

/** Payment history for a single service request (all payment attempts). */
async function getServicePaymentHistory(serviceRequestId) {
  if (!mongoose.Types.ObjectId.isValid(serviceRequestId)) {
    const err = new Error('Invalid service request id');
    err.statusCode = 400;
    throw err;
  }
  const request = await ServiceRequest.findById(serviceRequestId).lean();
  if (!request) {
    const err = new Error('Service request not found');
    err.statusCode = 404;
    throw err;
  }
  const payments = await Payment.find({ serviceRequestId })
    .sort({ createdAt: -1 })
    .lean();
  const audits = await PaymentAudit.find({ resourceId: String(serviceRequestId) })
    .sort({ timestamp: -1 })
    .limit(50)
    .lean();
  return { request, payments, audits };
}

/** Settlement dashboard for dark store payouts. */
async function listSettlements({ darkStoreId, status, page, limit }) {
  const { page: p, limit: l, skip } = paginate(page, limit);
  const filter = { beneficiaryType: 'dark_store' };
  if (darkStoreId) filter.beneficiaryId = String(darkStoreId);
  if (status) filter.status = String(status);

  const [items, total] = await Promise.all([
    Settlement.find(filter).sort({ createdAt: -1 }).skip(skip).limit(l).lean(),
    Settlement.countDocuments(filter),
  ]);

  const paymentIds = items.map((s) => s.paymentId);
  const payments = await Payment.find({ _id: { $in: paymentIds } })
    .select('orderId amount paidAt darkStoreId')
    .lean();
  const payMap = Object.fromEntries(payments.map((pay) => [String(pay._id), pay]));

  const [summary] = await Settlement.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        amount: { $sum: '$amount' },
      },
    },
  ]);

  const byStatus = await Settlement.aggregate([
    { $match: { beneficiaryType: 'dark_store', ...(darkStoreId ? { beneficiaryId: String(darkStoreId) } : {}) } },
    { $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$amount' } } },
  ]);

  return {
    items: items.map((s) => ({ ...s, payment: payMap[String(s.paymentId)] || null })),
    byStatus,
    total,
    page: p,
    limit: l,
  };
}

async function processDarkstoreSettlement(settlementId, adminId, req) {
  const paymentService = require('./payment.service');
  return paymentService.processSettlement(settlementId, adminId, req);
}

/** Monthly payment reports for dark store. */
async function getMonthlyReport({ darkStoreId, year, month }) {
  const y = parseInt(year, 10) || new Date().getFullYear();
  const m = parseInt(month, 10) || new Date().getMonth() + 1;
  const from = new Date(Date.UTC(y, m - 1, 1));
  const to = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));

  const match = {
    ...darkStoreFilter(darkStoreId),
    status: 'PAYMENT_SUCCESS',
    paidAt: { $gte: from, $lte: to },
  };
  const storeJobs = {
    ...darkStoreFilter(darkStoreId),
    createdAt: { $gte: from, $lte: to },
  };

  const [[totals], byDay, paymentByStatus, jobStats, failedPayments, revenueRollup] =
    await Promise.all([
      Payment.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            gross: { $sum: '$amount' },
            gmp: { $sum: '$gmpShare' },
            partner: { $sum: '$cobblerShare' },
            count: { $sum: 1 },
          },
        },
      ]),
      Payment.aggregate([
        { $match: match },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$paidAt' } },
            gross: { $sum: '$amount' },
            gmp: { $sum: '$gmpShare' },
            partner: { $sum: '$cobblerShare' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Payment.aggregate([
        {
          $match: {
            ...darkStoreFilter(darkStoreId),
            createdAt: { $gte: from, $lte: to },
          },
        },
        { $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$amount' } } },
      ]),
      ServiceRequest.aggregate([
        { $match: storeJobs },
        {
          $group: {
            _id: null,
            totalJobs: { $sum: 1 },
            completed: {
              $sum: {
                $cond: [
                  {
                    $or: [
                      { $eq: ['$status', 'completed'] },
                      { $eq: ['$trackingState', 'delivered'] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            cancelled: {
              $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
            },
          },
        },
      ]),
      Payment.countDocuments({
        ...darkStoreFilter(darkStoreId),
        status: 'PAYMENT_FAILED',
        createdAt: { $gte: from, $lte: to },
      }),
      Revenue.find({
        period: 'daily',
        periodKey: {
          $gte: from.toISOString().slice(0, 10),
          $lte: to.toISOString().slice(0, 10),
        },
        providerType: 'dark_store',
        ...(darkStoreId ? { beneficiaryId: String(darkStoreId) } : {}),
      })
        .sort({ periodKey: 1 })
        .lean(),
    ]);

  const jobs = jobStats[0] || { totalJobs: 0, completed: 0, cancelled: 0 };
  const summary = totals || { gross: 0, gmp: 0, partner: 0, count: 0 };

  return {
    period: { year: y, month: m, from, to },
    totals: summary,
    // Flat aliases for older clients
    totalRevenue: summary.gross,
    revenue: summary.gross,
    gmpShare: summary.gmp,
    partnerShare: summary.partner,
    jobCount: jobs.totalJobs,
    paidJobs: summary.count,
    completedJobs: jobs.completed,
    cancelledJobs: jobs.cancelled,
    refundCount: failedPayments,
    byStatus: paymentByStatus,
    byDay: byDay.map((d) => ({
      date: d._id,
      gross: d.gross,
      gmp: d.gmp,
      partner: d.partner,
      count: d.count,
    })),
    revenueRollup,
  };
}

/** Payment notifications / alerts from audit log. */
async function listPaymentNotifications({ darkStoreId, page, limit }) {
  const { page: p, limit: l, skip } = paginate(page, limit);
  const paymentActions = [
    'darkstore_cost_updated',
    'cost_approved',
    'cost_rejected',
    'payment_success',
    'payment_failed',
    'payment_link_created',
    'settlement_processed',
    'refund_requested',
  ];

  let resourceIds = null;
  if (darkStoreId) {
    const requests = await ServiceRequest.find(darkStoreFilter(darkStoreId))
      .select('_id')
      .lean();
    const payments = await Payment.find(darkStoreFilter(darkStoreId)).select('_id').lean();
    resourceIds = [
      ...requests.map((r) => String(r._id)),
      ...payments.map((pay) => String(pay._id)),
    ];
  }

  const filter = { action: { $in: paymentActions } };
  if (resourceIds && resourceIds.length) {
    filter.resourceId = { $in: resourceIds };
  }

  const [items, total] = await Promise.all([
    PaymentAudit.find(filter).sort({ timestamp: -1 }).skip(skip).limit(l).lean(),
    PaymentAudit.countDocuments(filter),
  ]);

  return { items, total, page: p, limit: l };
}

module.exports = {
  listCostApprovalJobs,
  updateActualCost,
  listPaymentStatus,
  getPaymentStatusByOrder,
  listPaidJobs,
  listUnpaidJobs,
  getRevenueDashboard,
  listTransactions,
  getTransactionDetails,
  getServicePaymentHistory,
  listSettlements,
  processDarkstoreSettlement,
  getMonthlyReport,
  listPaymentNotifications,
};
