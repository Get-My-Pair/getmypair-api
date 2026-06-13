/**
 * Core payment workflow — orders, links, webhooks, cost approval, settlements, refunds.
 */
const mongoose = require('mongoose');
const Payment = require('../models/payment.model');
const Settlement = require('../models/settlement.model');
const Commission = require('../models/commission.model');
const Refund = require('../models/refund.model');
const WebhookLog = require('../models/webhookLog.model');
const Revenue = require('../models/revenue.model');
const Invoice = require('../models/invoice.model');
const { ServiceRequest } = require('../models/serviceRequest.model');
const User = require('../models/user.model');
const { calculateRevenueSplit } = require('./commission.service');
const zohoPayment = require('./zohoPayment.service');
const { logPaymentAudit } = require('./paymentAudit.service');
const paymentNotification = require('./paymentNotification.service');
const { updateServiceWorkflow, resolveProviderType } = require('../utils/paymentWorkflow.helper');
const logger = require('../utils/logger');

function generateOrderId(serviceRequestId) {
  return `GMP-${String(serviceRequestId).slice(-8)}-${Date.now()}`;
}

async function getPayableRequest(serviceRequestId, userId) {
  const request = await ServiceRequest.findOne({ _id: serviceRequestId, userId });
  if (!request) {
    const err = new Error('Service request not found');
    err.statusCode = 404;
    throw err;
  }
  if (request.actualCostUserDecision !== 'accepted') {
    const err = new Error('User must accept the final service cost before payment');
    err.statusCode = 400;
    throw err;
  }
  if (request.actualCost == null || request.actualCost <= 0) {
    const err = new Error('No payable amount on this request');
    err.statusCode = 400;
    throw err;
  }
  if (request.paymentState === 'PAYMENT_SUCCESS') {
    const err = new Error('This request is already paid');
    err.statusCode = 400;
    throw err;
  }
  return request;
}

async function findOrCreatePendingPayment(request) {
  let payment = await Payment.findOne({
    serviceRequestId: request._id,
    status: { $in: ['PAYMENT_PENDING', 'PAYMENT_INITIATED'] },
  }).sort({ createdAt: -1 });

  if (payment) return payment;

  const providerType = resolveProviderType(request);
  const split = calculateRevenueSplit(request.actualCost, providerType);
  const orderId = generateOrderId(request._id);

  payment = await Payment.create({
    orderId,
    serviceRequestId: request._id,
    userId: request.userId,
    amount: request.actualCost,
    currency: zohoPayment.normalizeCurrency('INR'),
    providerType,
    cobblerId: request.cobblerId || null,
    darkStoreId: request.darkStoreId || null,
    status: 'PAYMENT_PENDING',
    gmpShare: split.gmpShare,
    cobblerShare: split.cobblerShare,
    commissionPercent: split.commissionPercent,
  });

  await updateServiceWorkflow(request._id, {
    workflowStatus: 'PAYMENT_PENDING',
    paymentState: 'PAYMENT_PENDING',
    activePaymentId: payment._id,
  });

  return payment;
}

async function createPaymentOrder({ serviceRequestId, userId }, req) {
  const request = await getPayableRequest(serviceRequestId, userId);
  const payment = await findOrCreatePendingPayment(request);
  if (!payment.currency) {
    payment.currency = zohoPayment.normalizeCurrency('INR');
    await payment.save();
  }
  const zohoOrder = await zohoPayment.createPaymentOrder({
    orderId: payment.orderId,
    amount: payment.amount,
    currency: payment.currency,
    description: `GetMyPair service #${request._id}`,
  });

  payment.zohoOrderId = zohoOrder.order_id || zohoOrder.id || payment.zohoOrderId;
  payment.metadata = { ...payment.metadata, zohoOrder };
  await payment.save();

  await logPaymentAudit(
    {
      action: 'payment_order_created',
      resourceType: 'payment',
      resourceId: payment._id,
      userId,
      status: 'success',
      details: { orderId: payment.orderId, amount: payment.amount },
    },
    req
  );

  return { payment: payment.toObject(), zohoOrder };
}

async function resolveZohoCustomer(userId) {
  const user = await User.findById(userId).lean();
  if (!user) return {};
  const phone = String(user.mobile || '').replace(/\D/g, '').slice(-10);
  return {
    name: user.name || undefined,
    email: user.email || undefined,
    phone: phone || undefined,
    phone_country_code: 'IN',
  };
}

function resolvePaymentZohoMode(payment) {
  return zohoPayment.normalizeZohoMode(payment?.metadata?.zohoMode || 'live');
}

async function createPaymentLink({ serviceRequestId, userId, redirectUrl, paymentMode }, req) {
  const request = await getPayableRequest(serviceRequestId, userId);
  const payment = await findOrCreatePendingPayment(request);
  if (!payment.currency) {
    payment.currency = zohoPayment.normalizeCurrency('INR');
    await payment.save();
  }
  const customer = await resolveZohoCustomer(userId);
  const zohoMode = zohoPayment.normalizeZohoMode(paymentMode);

  const link = await zohoPayment.createPaymentLink({
    orderId: payment.orderId,
    amount: payment.amount,
    currency: payment.currency,
    redirectUrl,
    customer,
    description: `GetMyPair service payment #${String(request._id).slice(-8)}`,
    mode: zohoMode,
  });

  payment.paymentLinkUrl = link.url;
  payment.zohoOrderId = link.payment_link_id || payment.zohoOrderId;
  payment.status = 'PAYMENT_INITIATED';
  payment.metadata = {
    ...payment.metadata,
    zohoMode,
    paymentLink: link,
  };
  await payment.save();

  await updateServiceWorkflow(request._id, {
    paymentState: 'PAYMENT_INITIATED',
    workflowStatus: 'PAYMENT_PENDING',
  });

  await logPaymentAudit(
    {
      action: 'payment_link_created',
      resourceType: 'payment',
      resourceId: payment._id,
      userId,
      status: 'success',
      details: { url: link.url, zohoMode },
    },
    req
  );

  return { payment: payment.toObject(), paymentLink: link, zohoMode };
}

async function verifyPayment({ orderId, userId }, req) {
  const payment = await Payment.findOne(
    userId ? { orderId, userId } : { orderId }
  );
  if (!payment) {
    const err = new Error('Payment not found');
    err.statusCode = 404;
    throw err;
  }

  const zohoResult = await zohoPayment.verifyPayment({
    orderId: payment.orderId,
    zohoPaymentId: payment.zohoPaymentId,
    zohoPaymentLinkId: payment.zohoOrderId || payment.zohoPaymentId,
    mode: resolvePaymentZohoMode(payment),
  });

  const paid = zohoPayment.isPaidStatus(
    zohoResult.status || zohoResult.payment_status
  );

  if (paid && payment.status !== 'PAYMENT_SUCCESS') {
    return processPaymentSuccess(payment, zohoResult, req);
  }
  if (!paid && payment.status === 'PAYMENT_INITIATED') {
    return { payment: payment.toObject(), verified: false, zoho: zohoResult };
  }
  return { payment: payment.toObject(), verified: paid, zoho: zohoResult };
}

async function processPaymentSuccess(payment, zohoPayload = {}, req = null) {
  if (payment.status === 'PAYMENT_SUCCESS') {
    return { payment: payment.toObject(), alreadyProcessed: true };
  }

  const request = await ServiceRequest.findById(payment.serviceRequestId);
  if (!request) {
    const err = new Error('Service request not found for payment');
    err.statusCode = 404;
    throw err;
  }

  const split = calculateRevenueSplit(payment.amount, payment.providerType);
  payment.status = 'PAYMENT_SUCCESS';
  payment.gmpShare = split.gmpShare;
  payment.cobblerShare = split.cobblerShare;
  payment.commissionPercent = split.commissionPercent;
  payment.paidAt = new Date();
  payment.zohoPaymentId =
    zohoPayload.payment_id || zohoPayload.id || payment.zohoPaymentId;
  payment.metadata = { ...payment.metadata, zohoSuccess: zohoPayload };
  await payment.save();

  await Commission.findOneAndUpdate(
    { paymentId: payment._id },
    {
      paymentId: payment._id,
      serviceRequestId: payment.serviceRequestId,
      totalAmount: payment.amount,
      gmpAmount: split.gmpShare,
      partnerAmount: split.partnerShare,
      partnerType: payment.providerType,
      partnerId: String(payment.cobblerId || payment.darkStoreId || ''),
      commissionPercent: split.commissionPercent,
    },
    { upsert: true, new: true }
  );

  await Settlement.create({
    paymentId: payment._id,
    serviceRequestId: payment.serviceRequestId,
    beneficiaryType: payment.providerType === 'cobbler' ? 'cobbler' : payment.providerType,
    beneficiaryId: String(payment.cobblerId || payment.darkStoreId || 'gmp'),
    amount: split.partnerShare,
    status: 'pending',
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  if (split.gmpShare > 0) {
    await Settlement.create({
      paymentId: payment._id,
      serviceRequestId: payment.serviceRequestId,
      beneficiaryType: 'gmp',
      beneficiaryId: 'gmp-platform',
      amount: split.gmpShare,
      status: 'completed',
      processedAt: new Date(),
    });
  }

  await recordDailyRevenue(payment, split);

  await updateServiceWorkflow(
    request._id,
    {
      workflowStatus: 'PAYMENT_SUCCESS',
      paymentState: 'PAYMENT_SUCCESS',
      status: 'pickup_assigned',
      trackingState: 'pickup_scheduled',
      activePaymentId: payment._id,
    },
    { actorType: 'system', note: `Payment received (₹${payment.amount})` }
  );

  await paymentNotification.notifyPaymentSuccess({
    userId: request.userId,
    serviceRequestId: request._id,
    amount: payment.amount,
  });

  await logPaymentAudit(
    {
      action: 'payment_success',
      resourceType: 'payment',
      resourceId: payment._id,
      userId: payment.userId,
      status: 'success',
      details: { orderId: payment.orderId, amount: payment.amount },
    },
    req
  );

  return { payment: payment.toObject(), request: request.toObject() };
}

async function processPaymentFailed(payment, reason, req = null) {
  payment.status = 'PAYMENT_FAILED';
  payment.failedAt = new Date();
  payment.failureReason = reason || 'Payment failed';
  await payment.save();

  await updateServiceWorkflow(payment.serviceRequestId, {
    paymentState: 'PAYMENT_FAILED',
    workflowStatus: 'PAYMENT_PENDING',
  });

  const request = await ServiceRequest.findById(payment.serviceRequestId).lean();
  if (request) {
    await paymentNotification.notifyPaymentFailed({
      userId: request.userId,
      serviceRequestId: request._id,
      reason,
    });
  }

  await logPaymentAudit(
    {
      action: 'payment_failed',
      resourceType: 'payment',
      resourceId: payment._id,
      status: 'failure',
      errorMessage: reason,
    },
    req
  );

  return { payment: payment.toObject() };
}

async function processPaymentPending(payment, req = null) {
  payment.status = 'PAYMENT_PENDING';
  await payment.save();
  await updateServiceWorkflow(payment.serviceRequestId, {
    paymentState: 'PAYMENT_PENDING',
  });
  await logPaymentAudit(
    {
      action: 'payment_pending',
      resourceType: 'payment',
      resourceId: payment._id,
      status: 'info',
    },
    req
  );
  return { payment: payment.toObject() };
}

async function handleZohoWebhook(rawBody, headers, req) {
  const signature = headers['x-zoho-signature'] || headers['x-webhook-signature'];
  const signatureValid = zohoPayment.verifyWebhookSignature(rawBody, signature);

  let payload;
  try {
    payload = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
  } catch {
    payload = rawBody;
  }

  const log = await WebhookLog.create({
    provider: 'zoho',
    eventType: payload.event || payload.status || 'unknown',
    orderId: payload.reference_id || payload.order_id || payload.orderId,
    signatureValid,
    payload,
    headers: { ...headers },
  });

  if (!signatureValid && process.env.NODE_ENV === 'production') {
    log.processed = false;
    log.processingError = 'Invalid webhook signature';
    await log.save();
    const err = new Error('Invalid webhook signature');
    err.statusCode = 401;
    throw err;
  }

  const orderId =
    payload.reference_id ||
    payload.order_id ||
    payload.orderId ||
    payload.payment_link?.reference_id;

  const payment = orderId ? await Payment.findOne({ orderId }) : null;
  if (payment) {
    log.paymentId = payment._id;
    log.orderId = orderId;
  }

  try {
    const status = String(payload.status || payload.payment_status || '').toLowerCase();
    if (payment) {
      if (zohoPayment.isPaidStatus(status)) {
        await processPaymentSuccess(payment, payload, req);
      } else if (['failed', 'failure', 'declined'].includes(status)) {
        await processPaymentFailed(payment, payload.failure_reason || status, req);
      } else if (['pending', 'initiated'].includes(status)) {
        await processPaymentPending(payment, req);
      }
    }
    log.processed = true;
  } catch (err) {
    log.processed = false;
    log.processingError = err.message;
    logger.error(`Webhook processing error: ${err.message}`);
    throw err;
  } finally {
    await log.save();
  }

  return { processed: log.processed, webhookLogId: log._id };
}

/**
 * Zoho return URL handler — customer redirected here after checkout.
 * Query: payment_link_id, payment_id, amount, status, payment_link_reference, signature
 */
async function handlePaymentCallback(query = {}, req = null) {
  const zohoOAuth = require('./zohoOAuth.service');
  if (zohoOAuth.isOAuthRedirectQuery(query)) {
    const err = new Error(
      'OAuth redirect received — redeploy the latest API so /api/payment/callback handles Zoho OAuth automatically.'
    );
    err.statusCode = 400;
    throw err;
  }

  const orderId =
    query.payment_link_reference ||
    query.reference_id ||
    query.orderId ||
    query.order_id;

  const signatureValid = zohoPayment.verifyReturnUrlSignature(query, query.signature);

  if (!signatureValid && process.env.NODE_ENV === 'production') {
    const err = new Error('Invalid payment callback signature');
    err.statusCode = 401;
    throw err;
  }

  const status = String(query.status || '').toLowerCase();
  let payment = orderId ? await Payment.findOne({ orderId }) : null;

  if (!payment && query.payment_link_id) {
    payment = await Payment.findOne({ zohoOrderId: query.payment_link_id });
  }

  if (!payment) {
    const err = new Error('Payment not found for callback');
    err.statusCode = 404;
    throw err;
  }

  if (query.payment_id) {
    payment.zohoPaymentId = query.payment_id;
  }
  if (query.payment_link_id && !payment.zohoOrderId) {
    payment.zohoOrderId = query.payment_link_id;
  }

  if (zohoPayment.isPaidStatus(status)) {
    const result = await processPaymentSuccess(
      payment,
      {
        payment_id: query.payment_id,
        payment_link_id: query.payment_link_id,
        amount: query.amount,
        status: query.status,
        reference_id: orderId,
        signatureValid,
        source: 'return_url',
      },
      req
    );
    return { ...result, callbackStatus: 'paid', signatureValid };
  }

  if (['failed', 'failure', 'declined'].includes(status)) {
    const result = await processPaymentFailed(payment, status, req);
    return { ...result, callbackStatus: 'failed', signatureValid };
  }

  await payment.save();
  return {
    payment: payment.toObject(),
    callbackStatus: status || 'pending',
    signatureValid,
  };
}

async function approveCost({ serviceRequestId, userId }, req) {
  const request = await ServiceRequest.findOne({ _id: serviceRequestId, userId });
  if (!request) {
    const err = new Error('Service request not found');
    err.statusCode = 404;
    throw err;
  }
  if (request.actualCost == null) {
    const err = new Error('No final service cost has been set');
    err.statusCode = 400;
    throw err;
  }
  if (request.actualCostUserDecision === 'accepted') {
    return { request: request.toObject(), alreadyAccepted: true };
  }
  if (request.actualCostUserDecision !== 'pending') {
    const err = new Error('No pending cost approval for this request');
    err.statusCode = 400;
    throw err;
  }

  request.actualCostUserDecision = 'accepted';
  request.actualCostAcceptedAt = new Date();
  const workflowStatus =
    request.routingType === 'direct' || request.cobblerId
      ? 'COBBLER_COST_PENDING'
      : 'COST_APPROVAL_PENDING';

  request.workflowStatus = 'PAYMENT_PENDING';
  request.paymentState = 'PAYMENT_PENDING';
  await request.save();

  await logPaymentAudit(
    {
      action: 'cost_approved',
      resourceType: 'service_request',
      resourceId: request._id,
      userId,
      status: 'success',
      details: { actualCost: request.actualCost, workflowStatus },
    },
    req
  );

  return { request: request.toObject() };
}

async function rejectCost({ serviceRequestId, userId, reason }, req) {
  const request = await ServiceRequest.findOne({ _id: serviceRequestId, userId });
  if (!request) {
    const err = new Error('Service request not found');
    err.statusCode = 404;
    throw err;
  }
  if (request.actualCostUserDecision !== 'pending') {
    const err = new Error('No pending cost approval for this request');
    err.statusCode = 400;
    throw err;
  }

  request.actualCostUserDecision = 'rejected';
  request.status = 'cancelled';
  request.trackingState = 'cancelled';
  request.workflowStatus = 'CLOSED';
  request.paymentState = 'PAYMENT_PENDING';
  await request.save();

  await logPaymentAudit(
    {
      action: 'cost_rejected',
      resourceType: 'service_request',
      resourceId: request._id,
      userId,
      status: 'success',
      details: { reason },
    },
    req
  );

  return { request: request.toObject() };
}

async function getPaymentByServiceRequest(serviceRequestId, userId) {
  const request = await ServiceRequest.findOne({ _id: serviceRequestId, userId }).lean();
  if (!request) {
    return {
      request: null,
      payment: null,
      serviceRequestFound: false,
    };
  }
  const payment = await Payment.findOne({ serviceRequestId: request._id })
    .sort({ createdAt: -1 })
    .lean();
  return {
    request,
    payment: payment || null,
    serviceRequestFound: true,
  };
}

async function getPaymentStatus({ orderId, userId, refresh = false }, req) {
  const payment = await Payment.findOne({ orderId, userId });
  if (!payment) {
    const err = new Error('Payment not found');
    err.statusCode = 404;
    throw err;
  }
  if (refresh && payment.status !== 'PAYMENT_SUCCESS') {
    return verifyPayment({ orderId, userId }, req);
  }
  return {
    payment: payment.toObject(),
    verified: payment.status === 'PAYMENT_SUCCESS',
    fromCache: true,
  };
}

async function listPaymentHistory(userId, { page = 1, limit = 20 }) {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Payment.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Payment.countDocuments({ userId }),
  ]);
  return { items, total, page, limit };
}

async function getPaymentDetails(paymentId, userId, isAdmin) {
  const filter = mongoose.Types.ObjectId.isValid(paymentId)
    ? { _id: paymentId }
    : { orderId: paymentId };
  if (!isAdmin) filter.userId = userId;
  const payment = await Payment.findOne(filter).lean();
  if (!payment) {
    const err = new Error('Payment not found');
    err.statusCode = 404;
    throw err;
  }
  return payment;
}

async function getCobblerEarnings(cobblerId, { from, to }) {
  const match = { cobblerId, status: 'PAYMENT_SUCCESS' };
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
        totalEarnings: { $sum: '$cobblerShare' },
        totalTransactions: { $sum: 1 },
        totalGross: { $sum: '$amount' },
      },
    },
  ]);
  const settlements = await Settlement.find({
    beneficiaryType: 'cobbler',
    beneficiaryId: String(cobblerId),
  })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  return {
    summary: summary || { totalEarnings: 0, totalTransactions: 0, totalGross: 0 },
    settlements,
  };
}

async function getDarkStoreRevenue(darkStoreId, { from, to }) {
  const match = { darkStoreId, status: 'PAYMENT_SUCCESS', providerType: 'dark_store' };
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
        transactionCount: { $sum: 1 },
      },
    },
  ]);
  return summary || { totalRevenue: 0, transactionCount: 0 };
}

async function processSettlement(settlementId, adminUserId, req) {
  const settlement = await Settlement.findById(settlementId);
  if (!settlement) {
    const err = new Error('Settlement not found');
    err.statusCode = 404;
    throw err;
  }
  if (settlement.status === 'completed') {
    return { settlement: settlement.toObject(), alreadyCompleted: true };
  }
  settlement.status = 'processing';
  await settlement.save();

  settlement.status = 'completed';
  settlement.processedAt = new Date();
  settlement.metadata = {
    ...settlement.metadata,
    processedBy: String(adminUserId),
  };
  await settlement.save();

  await logPaymentAudit(
    {
      action: 'settlement_processed',
      resourceType: 'settlement',
      resourceId: settlement._id,
      userId: adminUserId,
      status: 'success',
    },
    req
  );

  return { settlement: settlement.toObject() };
}

async function createRefund({ paymentId, userId, reason, amount }, req) {
  const payment = await Payment.findOne({ _id: paymentId, userId, status: 'PAYMENT_SUCCESS' });
  if (!payment) {
    const err = new Error('Paid payment not found');
    err.statusCode = 404;
    throw err;
  }
  const refundAmount = amount != null ? Number(amount) : payment.amount;
  const refund = await Refund.create({
    paymentId: payment._id,
    serviceRequestId: payment.serviceRequestId,
    userId,
    amount: refundAmount,
    reason,
    status: 'requested',
  });

  payment.status = 'PAYMENT_REFUNDED';
  payment.refundId = refund._id;
  await payment.save();

  await updateServiceWorkflow(payment.serviceRequestId, {
    paymentState: 'PAYMENT_REFUNDED',
  });

  await logPaymentAudit(
    {
      action: 'refund_requested',
      resourceType: 'refund',
      resourceId: refund._id,
      userId,
      status: 'success',
      details: { amount: refundAmount },
    },
    req
  );

  return { refund: refund.toObject(), payment: payment.toObject() };
}

async function getPaymentReport({ from, to, groupBy = 'day' }) {
  const match = { status: 'PAYMENT_SUCCESS' };
  if (from || to) {
    match.paidAt = {};
    if (from) match.paidAt.$gte = new Date(from);
    if (to) match.paidAt.$lte = new Date(to);
  }

  const dateFormat =
    groupBy === 'month' ? '%Y-%m' : groupBy === 'week' ? '%Y-%U' : '%Y-%m-%d';

  const byPeriod = await Payment.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $dateToString: { format: dateFormat, date: '$paidAt' } },
        gross: { $sum: '$amount' },
        gmp: { $sum: '$gmpShare' },
        partner: { $sum: '$cobblerShare' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const [totals] = await Payment.aggregate([
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
  ]);

  return { byPeriod, totals: totals || { gross: 0, gmp: 0, partner: 0, count: 0 } };
}

async function recordDailyRevenue(payment, split) {
  const d = payment.paidAt || new Date();
  const periodKey = d.toISOString().slice(0, 10);
  await Revenue.findOneAndUpdate(
    {
      period: 'daily',
      periodKey,
      providerType: payment.providerType,
      beneficiaryId: null,
    },
    {
      $inc: {
        totalCollected: payment.amount,
        gmpRevenue: split.gmpShare,
        partnerRevenue: split.partnerShare,
        transactionCount: 1,
      },
    },
    { upsert: true, new: true }
  );
}

async function runPendingSettlements() {
  const due = await Settlement.find({
    status: 'pending',
    scheduledAt: { $lte: new Date() },
  }).limit(100);

  let processed = 0;
  for (const s of due) {
    try {
      s.status = 'completed';
      s.processedAt = new Date();
      s.metadata = { ...s.metadata, autoSettled: true };
      await s.save();
      processed += 1;
    } catch (err) {
      logger.error(`Settlement auto-process failed ${s._id}: ${err.message}`);
    }
  }
  return { scanned: due.length, processed };
}

module.exports = {
  generateOrderId,
  createPaymentOrder,
  createPaymentLink,
  verifyPayment,
  processPaymentSuccess,
  processPaymentFailed,
  processPaymentPending,
  handleZohoWebhook,
  handlePaymentCallback,
  approveCost,
  rejectCost,
  listPaymentHistory,
  getPaymentByServiceRequest,
  getPaymentStatus,
  getPaymentDetails,
  getCobblerEarnings,
  getDarkStoreRevenue,
  processSettlement,
  createRefund,
  getPaymentReport,
  runPendingSettlements,
};
