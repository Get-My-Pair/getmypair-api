/**
 * Module 5 — Payment & Zoho workflow APIs
 */
const paymentService = require('../services/payment.service');
const { success, error: errorResponse } = require('../utils/response');
const logger = require('../utils/logger');
const config = require('../config/env');

const handleServiceError = (res, err) => {
  const code = err.statusCode || 500;
  if (code >= 500) logger.error(err.message);
  return errorResponse(res, err.message, code);
};

const createPaymentOrder = async (req, res) => {
  try {
    const data = await paymentService.createPaymentOrder(
      { serviceRequestId: req.body.serviceRequestId, userId: req.user._id },
      req
    );
    return success(res, 'Payment order created', data);
  } catch (err) {
    return handleServiceError(res, err);
  }
};

const createPaymentLink = async (req, res) => {
  try {
    const data = await paymentService.createPaymentLink(
      {
        serviceRequestId: req.body.serviceRequestId,
        userId: req.user._id,
        redirectUrl: req.body.redirectUrl,
      },
      req
    );
    return success(res, 'Payment link generated', data);
  } catch (err) {
    return handleServiceError(res, err);
  }
};

const verifyPayment = async (req, res) => {
  try {
    const data = await paymentService.verifyPayment(
      { orderId: req.body.orderId, userId: req.user._id },
      req
    );
    return success(res, 'Payment verification completed', data);
  } catch (err) {
    return handleServiceError(res, err);
  }
};

const zohoWebhook = async (req, res) => {
  try {
    const rawBody =
      req.rawBody ||
      (typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {}));
    const data = await paymentService.handleZohoWebhook(rawBody, req.headers, req);
    return success(res, 'Webhook processed', data);
  } catch (err) {
    const code = err.statusCode || 500;
    return errorResponse(res, err.message, code);
  }
};

const approveCost = async (req, res) => {
  try {
    const data = await paymentService.approveCost(
      { serviceRequestId: req.body.serviceRequestId, userId: req.user._id },
      req
    );
    return success(res, 'Service cost approved — proceed to payment', data);
  } catch (err) {
    return handleServiceError(res, err);
  }
};

const rejectCost = async (req, res) => {
  try {
    const data = await paymentService.rejectCost(
      {
        serviceRequestId: req.body.serviceRequestId,
        userId: req.user._id,
        reason: req.body.reason,
      },
      req
    );
    return success(res, 'Service cost rejected — request cancelled', data);
  } catch (err) {
    return handleServiceError(res, err);
  }
};

const paymentHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const data = await paymentService.listPaymentHistory(req.user._id, { page, limit });
    return success(res, 'Payment history retrieved', data);
  } catch (err) {
    return handleServiceError(res, err);
  }
};

const paymentStatus = async (req, res) => {
  try {
    const refresh = req.query.refresh === 'true' || req.query.refresh === '1';
    const data = await paymentService.getPaymentStatus(
      { orderId: req.params.orderId, userId: req.user._id, refresh },
      req
    );
    return success(res, 'Payment status retrieved', data);
  } catch (err) {
    return handleServiceError(res, err);
  }
};

const paymentDetails = async (req, res) => {
  try {
    const isAdmin = req.userRoles?.includes?.('ADMIN') || req.user?.role === 'ADMIN';
    const payment = await paymentService.getPaymentDetails(
      req.params.paymentId,
      req.user._id,
      isAdmin
    );
    return success(res, 'Payment details retrieved', { payment });
  } catch (err) {
    return handleServiceError(res, err);
  }
};

const cobblerEarnings = async (req, res) => {
  try {
    const data = await paymentService.getCobblerEarnings(req.user._id, {
      from: req.query.from,
      to: req.query.to,
    });
    return success(res, 'Cobbler earnings retrieved', data);
  } catch (err) {
    return handleServiceError(res, err);
  }
};

const darkStoreRevenue = async (req, res) => {
  try {
    const data = await paymentService.getDarkStoreRevenue(req.params.darkStoreId, {
      from: req.query.from,
      to: req.query.to,
    });
    return success(res, 'Dark store revenue retrieved', { revenue: data });
  } catch (err) {
    return handleServiceError(res, err);
  }
};

const processSettlement = async (req, res) => {
  try {
    const data = await paymentService.processSettlement(
      req.body.settlementId,
      req.user._id,
      req
    );
    return success(res, 'Settlement processed', data);
  } catch (err) {
    return handleServiceError(res, err);
  }
};

const createRefund = async (req, res) => {
  try {
    const data = await paymentService.createRefund(
      {
        paymentId: req.body.paymentId,
        userId: req.user._id,
        reason: req.body.reason,
        amount: req.body.amount,
      },
      req
    );
    return success(res, 'Refund initiated', data);
  } catch (err) {
    return handleServiceError(res, err);
  }
};

const paymentReport = async (req, res) => {
  try {
    const data = await paymentService.getPaymentReport({
      from: req.query.from,
      to: req.query.to,
      groupBy: req.query.groupBy,
    });
    return success(res, 'Payment report generated', data);
  } catch (err) {
    return handleServiceError(res, err);
  }
};

/** Dev mock checkout — simulates Zoho redirect success */
const mockCheckout = async (req, res) => {
  try {
    const { orderId } = req.query;
    if (!orderId) {
      return errorResponse(res, 'orderId query required', 400);
    }
    const Payment = require('../models/payment.model');
    const payment = await Payment.findOne({ orderId });
    if (!payment) {
      return errorResponse(res, 'Payment not found', 404);
    }
    const result = await paymentService.processPaymentSuccess(payment, { mock: true }, req);
    return res.send(
      `<html><body><h2>Mock payment success</h2><pre>${JSON.stringify(result.payment, null, 2)}</pre></body></html>`
    );
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const commissionPreview = async (req, res) => {
  try {
    const { calculateRevenueSplit } = require('../services/commission.service');
    const amount = Number(req.query.amount) || 0;
    const providerType = req.query.providerType || 'cobbler';
    const split = calculateRevenueSplit(amount, providerType);
    return success(res, 'Commission split calculated', { split });
  } catch (err) {
    return handleServiceError(res, err);
  }
};

module.exports = {
  createPaymentOrder,
  createPaymentLink,
  verifyPayment,
  zohoWebhook,
  approveCost,
  rejectCost,
  paymentHistory,
  paymentStatus,
  paymentDetails,
  cobblerEarnings,
  darkStoreRevenue,
  processSettlement,
  createRefund,
  paymentReport,
  mockCheckout,
  commissionPreview,
};
