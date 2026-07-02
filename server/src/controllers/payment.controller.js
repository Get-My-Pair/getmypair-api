/**
 * Module 5 — Payment & Zoho workflow APIs
 */
const paymentService = require('../services/payment.service');
const zohoOAuth = require('../services/zohoOAuth.service');
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
        paymentMode: req.body.paymentMode,
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

const paymentByServiceRequest = async (req, res) => {
  try {
    const data = await paymentService.getPaymentByServiceRequest(
      req.params.serviceRequestId,
      req.user._id
    );
    return success(res, 'Payment for service request retrieved', data);
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

/** Zoho return URL — OAuth setup or customer redirected after checkout (no auth). */
const paymentCallback = async (req, res) => {
  try {
    if (zohoOAuth.isOAuthRedirectQuery(req.query)) {
      try {
        const { refreshToken } = await zohoOAuth.exchangeAuthorizationCode(req.query.code);
        const safeToken = String(refreshToken).replace(/</g, '&lt;');
        return res.status(200).send(`<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8" /><title>Zoho OAuth success</title></head>
<body style="font-family:system-ui;padding:24px;max-width:720px;margin:0 auto;line-height:1.5;">
  <h1 style="color:#0d7a3f;">Zoho OAuth connected</h1>
  <p>Refresh token received. Payments will work on this server instance immediately.</p>
  <p><strong>Persist on Render:</strong> open Render → Environment → add:</p>
  <pre style="background:#f4f4f4;padding:12px;overflow:auto;word-break:break-all;">ZOHO_REFRESH_TOKEN=${safeToken}
ZOHO_PAYMENTS_MOCK=false</pre>
  <p>Then redeploy so the token survives restarts.</p>
  <p>Verify locally: <code>node scripts/zoho-oauth.js test</code></p>
</body></html>`);
      } catch (oauthErr) {
        const safeCode = String(req.query.code).replace(/</g, '&lt;');
        return res.status(200).send(`<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8" /><title>Zoho OAuth</title></head>
<body style="font-family:system-ui;padding:24px;max-width:720px;margin:0 auto;">
  <h1>Zoho OAuth authorization received</h1>
  <p>Auto-exchange failed: ${String(oauthErr.message).replace(/</g, '&lt;')}</p>
  <p>Run on your PC within 2 minutes:</p>
  <pre style="background:#f4f4f4;padding:12px;overflow:auto;">node scripts/zoho-oauth.js exchange --code=${safeCode}</pre>
</body></html>`);
      }
    }

    const data = await paymentService.handlePaymentCallback(req.query, req);
    const paid = data.callbackStatus === 'paid' || data.payment?.status === 'PAYMENT_SUCCESS';
    const orderId = data.payment?.orderId || req.query.payment_link_reference || '';
    const title = paid ? 'Payment successful' : 'Payment status received';
    const message = paid
      ? 'Thank you! Your payment was received. You can close this window and return to the app.'
      : 'Payment is being processed. Return to the app and tap “I completed payment — verify”.';

    return res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 32px 20px; background: #f6f8fa; color: #1a1a1a; }
    .card { max-width: 420px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 2px 12px rgba(0,0,0,.08); }
    h1 { font-size: 1.25rem; margin: 0 0 8px; color: ${paid ? '#0d7a3f' : '#b45309'}; }
    p { line-height: 1.5; margin: 0; color: #444; }
    .meta { margin-top: 16px; font-size: 0.85rem; color: #666; }
  </style>
</head>
<body>
  <div class="card" id="payment-success">
    <h1>${title}</h1>
    <p>${message}</p>
    ${orderId ? `<p class="meta">Order: ${orderId}</p>` : ''}
  </div>
</body>
</html>`);
  } catch (err) {
    const code = err.statusCode || 500;
    logger.error(`Payment callback error: ${err.message}`);
    return res.status(code).send(`<!DOCTYPE html>
<html><body><h2>Payment callback error</h2><p>${err.message}</p></body></html>`);
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
  paymentByServiceRequest,
  paymentStatus,
  paymentDetails,
  cobblerEarnings,
  darkStoreRevenue,
  processSettlement,
  createRefund,
  paymentReport,
  paymentCallback,
  commissionPreview,
};
