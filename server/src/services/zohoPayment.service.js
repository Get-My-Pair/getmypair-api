/**
 * Zoho Payments integration — create orders, payment links, verify status.
 * Set ZOHO_PAYMENTS_MOCK=true for local dev without Zoho credentials.
 */
const crypto = require('crypto');
const config = require('../config/env');
const logger = require('../utils/logger');

const isMock = () =>
  config.ZOHO_PAYMENTS_MOCK === true ||
  config.ZOHO_PAYMENTS_MOCK === 'true' ||
  !config.ZOHO_API_KEY;

async function zohoFetch(path, options = {}) {
  const base = (config.ZOHO_PAYMENTS_BASE_URL || 'https://payments.zoho.in/api/v1').replace(/\/$/, '');
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Zoho-oauthtoken ${config.ZOHO_API_KEY}`,
    ...(options.headers || {}),
  };
  const res = await fetch(url, { ...options, headers });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(body.message || body.error || `Zoho API error ${res.status}`);
    err.statusCode = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

/**
 * Create a payment order in Zoho (or mock).
 */
async function createPaymentOrder({ orderId, amount, currency, customer, description }) {
  if (isMock()) {
    return {
      order_id: `mock_order_${orderId}`,
      amount,
      currency: currency || 'INR',
      status: 'created',
      mock: true,
    };
  }
  return zohoFetch('/paymentlinks', {
    method: 'POST',
    body: JSON.stringify({
      amount,
      currency_code: currency || 'INR',
      reference_id: orderId,
      description: description || 'GetMyPair service payment',
      customer: customer || {},
    }),
  });
}

/**
 * Generate payment link URL for checkout.
 */
async function createPaymentLink({ orderId, amount, currency, customer, redirectUrl }) {
  if (isMock()) {
    const base = config.API_PUBLIC_BASE_URL || `http://localhost:${config.PORT}`;
    return {
      payment_link_id: `mock_link_${orderId}`,
      url: `${base}/api/payment/mock-checkout?orderId=${encodeURIComponent(orderId)}&amount=${amount}`,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      mock: true,
    };
  }
  const payload = {
    amount,
    currency_code: currency || 'INR',
    reference_id: orderId,
    redirect_url: redirectUrl || config.ZOHO_PAYMENT_RETURN_URL,
    customer: customer || {},
  };
  const result = await zohoFetch('/paymentlinks', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return {
    payment_link_id: result.payment_link_id || result.id,
    url: result.payment_link || result.url || result.short_url,
    expires_at: result.expires_at,
  };
}

/**
 * Verify payment status with Zoho by reference / payment id.
 */
async function verifyPayment({ orderId, zohoPaymentId }) {
  if (isMock()) {
    return {
      status: 'paid',
      reference_id: orderId,
      payment_id: zohoPaymentId || `mock_pay_${orderId}`,
      mock: true,
    };
  }
  if (zohoPaymentId) {
    return zohoFetch(`/payments/${zohoPaymentId}`);
  }
  return zohoFetch(`/payments?reference_id=${encodeURIComponent(orderId)}`);
}

/**
 * Validate webhook signature (HMAC-SHA256 of raw body).
 */
function verifyWebhookSignature(rawBody, signatureHeader) {
  const secret = config.ZOHO_WEBHOOK_SECRET;
  if (!secret) {
    return config.NODE_ENV !== 'production';
  }
  if (!signatureHeader) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const provided = String(signatureHeader).replace(/^sha256=/i, '').trim();
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
  } catch {
    return expected === provided;
  }
}

module.exports = {
  createPaymentOrder,
  createPaymentLink,
  verifyPayment,
  verifyWebhookSignature,
  isMock,
};
