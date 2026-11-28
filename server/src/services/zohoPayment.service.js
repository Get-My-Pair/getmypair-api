/**
 * Zoho Payments integration — create orders, payment links, verify status.
 * India API docs: https://www.zoho.com/in/payments/api/v1/payment-links/
 * Live and sandbox Zoho Payments — no internal mock checkout.
 */
const crypto = require('crypto');
const config = require('../config/env');
const { getZohoRuntimeConfig, normalizeZohoMode } = require('../config/zohoRuntimeConfig');
const logger = require('../utils/logger');
const zohoOAuth = require('./zohoOAuth.service');

function assertLiveZohoConfigured(runtime) {
  if (!zohoOAuth.isConfiguredForRuntime(runtime)) {
    const label = runtime.mode === 'sandbox' ? 'sandbox' : 'live';
    const err = new Error(
      runtime.mode === 'sandbox'
        ? 'Zoho Sandbox is not configured. Set ZOHO_SANDBOX_CLIENT_ID, ZOHO_SANDBOX_CLIENT_SECRET, ZOHO_SANDBOX_REFRESH_TOKEN, and ZOHO_SANDBOX_ACCOUNT_ID in server/.env'
        : 'Zoho Payments is not configured. Set ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN, and ZOHO_ACCOUNT_ID in server/.env'
    );
    err.statusCode = 503;
    err.zohoMode = label;
    throw err;
  }
}

function normalizeCurrency(currency) {
  const code = String(currency || config.ZOHO_PAYMENT_CURRENCY || 'INR')
    .trim()
    .toUpperCase();
  return /^[A-Z]{3}$/.test(code) ? code : 'INR';
}

function normalizeAmount(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) {
    const err = new Error('Invalid payment amount');
    err.statusCode = 400;
    throw err;
  }
  return Math.round(n * 100) / 100;
}

function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length >= 10) return digits.slice(-10);
  return digits || undefined;
}

function buildApiPath(resourcePath, accountId = '') {
  const basePath = resourcePath.startsWith('/') ? resourcePath : `/${resourcePath}`;
  const resolvedAccountId = String(accountId || '').trim();
  if (!resolvedAccountId) return basePath;
  const joiner = basePath.includes('?') ? '&' : '?';
  return `${basePath}${joiner}account_id=${encodeURIComponent(resolvedAccountId)}`;
}

function extractZohoError(body, status) {
  if (!body || typeof body !== 'object') {
    return `Zoho API error ${status}`;
  }
  if (body.message) return String(body.message);
  if (body.error_description) return String(body.error_description);
  if (body.error) return String(body.error);
  if (Array.isArray(body.errors) && body.errors.length) {
    return body.errors
      .map((e) => e.message || e.error_message || JSON.stringify(e))
      .join('; ');
  }
  return `Zoho API error ${status}`;
}

function enrichZohoAuthError(err) {
  const message = String(err.message || '');
  const lower = message.toLowerCase();
  if (
    lower.includes('not an authorized user') ||
    lower.includes('unauthorized') ||
    err.statusCode === 401
  ) {
    err.message =
      'Zoho Payments authentication failed. Ensure ZOHO_REFRESH_TOKEN is set (run: node scripts/zoho-oauth.js auth-url), ' +
      'ZOHO_ACCOUNT_ID matches your Zoho Payments account, and ZOHO_API_KEY is not the OAuth Client ID.';
  }
  return err;
}

async function zohoFetch(path, options = {}, attempt = 0, mode = 'live') {
  const runtime = getZohoRuntimeConfig(mode);
  const base = String(runtime.baseUrl || '').replace(/\/$/, '');
  const url = `${base}${buildApiPath(path, runtime.accountId)}`;
  const accessToken = await zohoOAuth.getAccessTokenForRuntime(runtime.mode, {
    forceRefresh: attempt > 0,
  });
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Zoho-oauthtoken ${accessToken}`,
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
    if (res.status === 401 && attempt === 0 && zohoOAuth.hasOAuthRefreshFlowForRuntime(runtime)) {
      zohoOAuth.clearTokenCacheForRuntime(runtime.mode);
      return zohoFetch(path, options, attempt + 1, mode);
    }
    const err = enrichZohoAuthError(
      Object.assign(new Error(extractZohoError(body, res.status)), {
        statusCode: res.status,
        body,
      })
    );
    throw err;
  }
  return body;
}

function buildPaymentLinkPayload({
  orderId,
  amount,
  currency,
  customer,
  redirectUrl,
  description,
  runtime,
}) {
  const payload = {
    amount: normalizeAmount(amount),
    currency: normalizeCurrency(currency),
    reference_id: String(orderId),
    description:
      description ||
      `GetMyPair service payment for order ${String(orderId).slice(0, 48)}`,
  };

  const returnUrl = redirectUrl || runtime?.returnUrl || config.ZOHO_PAYMENT_RETURN_URL;
  if (returnUrl) payload.return_url = returnUrl;

  const c = customer || {};
  if (c.email) payload.email = String(c.email).trim();
  const phone = normalizePhone(c.phone);
  if (phone) {
    payload.phone = phone;
    payload.phone_country_code = c.phone_country_code || 'IN';
  }

  return payload;
}

function unwrapPaymentLink(result) {
  if (!result || typeof result !== 'object') return {};
  return result.payment_links || result.payment_link || result;
}

function parsePaymentLinkResponse(result) {
  const link = unwrapPaymentLink(result);
  const url = link.url || link.payment_link || link.short_url;
  if (!url) {
    const err = new Error('Zoho did not return a payment link URL');
    err.statusCode = 502;
    err.body = result;
    throw err;
  }
  return {
    payment_link_id: link.payment_link_id || link.id,
    url,
    expires_at: link.expires_at,
    status: link.status,
    reference_id: link.reference_id,
  };
}

function normalizePaymentStatus(payload) {
  const link = unwrapPaymentLink(payload);
  const status = String(
    link.status || payload.status || payload.payment_status || ''
  ).toLowerCase();
  return status;
}

function isPaidStatus(status) {
  const s = String(status || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_');
  return [
    'paid',
    'success',
    'successful',
    'captured',
    'completed',
    'succeeded',
    'payment_success',
    'payment_successful',
    'payment_captured',
    'payment_completed',
    'processed',
  ].includes(s);
}

/**
 * Create a payment order in Zoho.
 */
async function createPaymentOrder({
  orderId,
  amount,
  currency,
  customer,
  description,
  mode = 'live',
}) {
  const runtime = getZohoRuntimeConfig(mode);
  assertLiveZohoConfigured(runtime);

  const payload = buildPaymentLinkPayload({
    orderId,
    amount,
    currency,
    customer,
    description,
    runtime,
  });

  const result = await zohoFetch(
    '/paymentlinks',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    0,
    mode
  );

  const link = parsePaymentLinkResponse(result);
  return {
    order_id: link.payment_link_id || orderId,
    id: link.payment_link_id,
    url: link.url,
    currency: payload.currency,
    amount: payload.amount,
    status: 'created',
    zohoMode: runtime.mode,
  };
}

/**
 * Generate payment link URL for checkout.
 */
async function createPaymentLink({
  orderId,
  amount,
  currency,
  customer,
  redirectUrl,
  description,
  mode = 'live',
}) {
  const runtime = getZohoRuntimeConfig(mode);
  assertLiveZohoConfigured(runtime);

  const payload = buildPaymentLinkPayload({
    orderId,
    amount,
    currency,
    customer,
    redirectUrl,
    description,
    runtime,
  });

  if (!runtime.accountId) {
    logger.warn(
      `[Zoho:${runtime.mode}] Account ID is not set — payment link request may fail. Add it to server/.env`
    );
  }

  logger.info(
    `[Zoho:${runtime.mode}] createPaymentLink order=${orderId} amount=${payload.amount} currency=${payload.currency}`
  );

  const result = await zohoFetch(
    '/paymentlinks',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    0,
    mode
  );

  const link = parsePaymentLinkResponse(result);
  return { ...link, zohoMode: runtime.mode };
}

/**
 * Verify payment status with Zoho by payment link id, reference id, or payment id.
 */
async function verifyPayment({
  orderId,
  zohoPaymentId,
  zohoPaymentLinkId,
  mode = 'live',
}) {
  const runtime = getZohoRuntimeConfig(mode);
  assertLiveZohoConfigured(runtime);

  const linkId = zohoPaymentLinkId || zohoPaymentId;
  if (linkId) {
    const linkResult = await zohoFetch(
      buildApiPath(`/paymentlinks/${linkId}`, runtime.accountId),
      {},
      0,
      mode
    );
    const link = unwrapPaymentLink(linkResult);
    const linkStatus = normalizePaymentStatus(link);
    // The link status can lag behind: also trust a succeeded entry in link.payments
    // or a fully-paid amount so a completed payment never stays "initiated".
    const linkPayments = Array.isArray(link.payments) ? link.payments : [];
    const succeededPayment = linkPayments.find((p) =>
      isPaidStatus(normalizePaymentStatus(p))
    );
    const amountPaid = Number(link.amount_paid);
    const amountDue = Number(link.amount);
    const fullyPaid =
      Number.isFinite(amountPaid) && amountPaid > 0 && Number.isFinite(amountDue) && amountPaid >= amountDue;
    if (isPaidStatus(linkStatus) || succeededPayment || fullyPaid) {
      return {
        status: 'paid',
        payment_status: linkStatus || 'paid',
        reference_id: link.reference_id || orderId,
        payment_id:
          (succeededPayment && (succeededPayment.payment_id || succeededPayment.id)) ||
          link.payment_id ||
          zohoPaymentId,
        payment_link_id: link.payment_link_id || linkId,
        amount: link.amount,
        amount_paid: link.amount_paid,
        raw: link,
      };
    }
    if (linkStatus) {
      return {
        status: linkStatus,
        payment_status: linkStatus,
        reference_id: link.reference_id || orderId,
        payment_link_id: link.payment_link_id || linkId,
        raw: link,
      };
    }
  }

  if (zohoPaymentId && !zohoPaymentLinkId) {
    try {
      const paymentResult = await zohoFetch(
        buildApiPath(`/payments/${zohoPaymentId}`, runtime.accountId),
        {},
        0,
        mode
      );
      const paymentStatus = normalizePaymentStatus(paymentResult);
      if (paymentStatus) {
        return {
          ...paymentResult,
          status: paymentStatus,
          payment_status: paymentStatus,
          payment_id: paymentResult.payment_id || paymentResult.id || zohoPaymentId,
        };
      }
    } catch (err) {
      if (err.statusCode !== 404) throw err;
    }
  }

  const listResult = await zohoFetch(
    buildApiPath(`/payments?reference_id=${encodeURIComponent(orderId)}`, runtime.accountId),
    {},
    0,
    mode
  );
  const payments = listResult.payments || listResult.payment || [];
  const items = Array.isArray(payments) ? payments : [payments].filter(Boolean);
  const paid = items.find((p) => isPaidStatus(normalizePaymentStatus(p)));
  if (paid) {
    const paymentStatus = normalizePaymentStatus(paid);
    return {
      ...paid,
      status: paymentStatus,
      payment_status: paymentStatus,
      payment_id: paid.payment_id || paid.id,
      reference_id: paid.reference_id || orderId,
    };
  }
  if (items[0]) {
    const paymentStatus = normalizePaymentStatus(items[0]);
    return {
      ...items[0],
      status: paymentStatus,
      payment_status: paymentStatus,
      reference_id: items[0].reference_id || orderId,
    };
  }
  return listResult;
}

/**
 * Verify return URL signature after Zoho checkout redirect.
 * Docs: payment_link_id.payment_id.amount.status.payment_link_reference
 */
function verifyReturnUrlSignature(params, signatureHeader) {
  const secret = String(config.ZOHO_SIGNING_KEY || '').trim();
  if (!secret) {
    return config.NODE_ENV !== 'production';
  }
  if (!signatureHeader) return false;

  const {
    payment_link_id = '',
    payment_id = '',
    amount = '',
    status = '',
    payment_link_reference = '',
  } = params || {};

  const message = [
    payment_link_id,
    payment_id,
    amount,
    status,
    payment_link_reference,
  ].join('.');

  const expected = crypto.createHmac('sha256', secret).update(message).digest('hex');
  const provided = String(signatureHeader).trim();
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
  } catch {
    return expected === provided;
  }
}

/**
 * Parse Zoho `X-Zoho-Webhook-Signature` (`t=<timestamp>,v=<hex>`) or a legacy plain hex.
 * @see https://www.zoho.com/in/payments/developerdocs/webhooks/verification/
 */
function parseZohoWebhookSignature(signatureHeader) {
  const raw = String(signatureHeader || '').trim();
  if (!raw) return null;

  const parts = {};
  for (const segment of raw.split(',')) {
    const idx = segment.indexOf('=');
    if (idx === -1) continue;
    const key = segment.slice(0, idx).trim();
    const value = segment
      .slice(idx + 1)
      .trim()
      .replace(/\s+/g, '');
    if (key) parts[key] = value;
  }

  if (parts.t && parts.v) {
    return { timestamp: parts.t, signature: parts.v };
  }

  return {
    timestamp: null,
    signature: raw.replace(/^sha256=/i, '').trim(),
  };
}

/**
 * Validate webhook signature per Zoho Payments:
 * HMAC-SHA256(signing_key, `${timestamp}.${rawBody}`) compared to header `v`.
 */
function verifyWebhookSignature(rawBody, signatureHeader) {
  const secret = config.ZOHO_WEBHOOK_SECRET;
  if (!secret) {
    return config.NODE_ENV !== 'production';
  }
  if (!signatureHeader) return false;

  const parsed = parseZohoWebhookSignature(signatureHeader);
  if (!parsed?.signature) return false;

  const body = typeof rawBody === 'string' ? rawBody : String(rawBody || '');
  const signedPayload =
    parsed.timestamp != null ? `${parsed.timestamp}.${body}` : body;
  const expected = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');
  const provided = parsed.signature;

  try {
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(provided, 'utf8');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return expected === provided;
  }
}

/**
 * Flatten Zoho webhook envelopes (`event_type` + `event_object`) into fields we process.
 */
function normalizeWebhookPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return {
      eventType: 'unknown',
      orderId: null,
      paymentLinkId: null,
      paymentId: null,
      status: '',
      failureReason: null,
    };
  }

  const eventType = String(payload.event_type || payload.event || '').toLowerCase();
  const eventObject =
    payload.event_object && typeof payload.event_object === 'object'
      ? payload.event_object
      : {};
  const link =
    eventObject.payment_links ||
    eventObject.payment_link ||
    payload.payment_links ||
    payload.payment_link ||
    {};
  const paymentObj = eventObject.payment || payload.payment || {};
  const nestedPayment =
    Array.isArray(link.payments) && link.payments[0] ? link.payments[0] : {};

  let status = String(
    link.status || paymentObj.status || payload.status || payload.payment_status || ''
  ).toLowerCase();

  if (!status && eventType) {
    if (eventType === 'payment_link.paid' || eventType === 'payment.succeeded') {
      status = 'paid';
    } else if (eventType === 'payment.failed') {
      status = 'failed';
    } else if (
      eventType === 'payment_link.canceled' ||
      eventType === 'payment_link.cancelled'
    ) {
      status = 'canceled';
    } else if (eventType === 'payment_link.expired') {
      status = 'expired';
    }
  }

  const orderId =
    link.reference_id ||
    paymentObj.reference_number ||
    payload.reference_id ||
    payload.order_id ||
    payload.orderId ||
    null;

  const paymentLinkId =
    link.payment_link_id || payload.payment_link_id || null;

  const paymentId =
    nestedPayment.payment_id ||
    paymentObj.payment_id ||
    payload.payment_id ||
    null;

  const failureReason =
    paymentObj.failure_code ||
    paymentObj.failure_category ||
    payload.failure_reason ||
    null;

  return {
    eventType: eventType || status || 'unknown',
    orderId: orderId ? String(orderId) : null,
    paymentLinkId: paymentLinkId ? String(paymentLinkId) : null,
    paymentId: paymentId ? String(paymentId) : null,
    status,
    failureReason,
  };
}

/* ------------------------------------------------------------------ */
/* Payment method / paid-time extraction                               */
/* ------------------------------------------------------------------ */

function normalizeMethodKey(raw) {
  const s = String(raw || '').toLowerCase().trim();
  if (!s) return null;
  if (/(upi|gpay|google_?pay|phone_?pe|paytm|bhim)/.test(s)) return 'upi';
  if (/(card|credit|debit|visa|master|rupay|amex)/.test(s)) return 'card';
  if (/(net_?banking|netbanking|net banking|bank)/.test(s)) return 'netbanking';
  if (/wallet/.test(s)) return 'wallet';
  if (/emi/.test(s)) return 'emi';
  return s.replace(/\s+/g, '_').slice(0, 32);
}

function firstString(...values) {
  for (const v of values) {
    if (v == null) continue;
    const s = String(v).trim();
    if (s && s !== '[object Object]') return s;
  }
  return '';
}

function readMethodDetail(methodKey, src) {
  if (!src || typeof src !== 'object') return '';
  if (methodKey === 'upi') {
    return firstString(src.vpa, src.upi_id, src.upi_vpa, src.payer_vpa, src.upi_app, src.app_name);
  }
  if (methodKey === 'card') {
    const last4 = firstString(src.last_four_digits, src.last4, src.card_last4, src.last_4_digits);
    const network = firstString(src.network, src.card_network, src.card_type, src.brand);
    if (last4) return `${network ? `${network} ` : ''}•••• ${last4}`;
    return network;
  }
  if (methodKey === 'netbanking') {
    return firstString(src.bank_name, src.bank, src.bank_code);
  }
  if (methodKey === 'wallet') {
    return firstString(src.wallet_name, src.wallet, src.provider);
  }
  return firstString(src.name, src.provider);
}

function parseGatewayDate(value) {
  if (value == null || value === '') return null;
  let d;
  if (typeof value === 'number') {
    d = new Date(value < 1e12 ? value * 1000 : value);
  } else {
    const str = String(value).trim().replace(/([+-]\d{2})(\d{2})$/, '$1:$2');
    d = /^\d{10,13}$/.test(str)
      ? new Date(str.length <= 10 ? Number(str) * 1000 : Number(str))
      : new Date(str);
  }
  if (Number.isNaN(d.getTime())) return null;
  // Ignore nonsense values (before 2020 or more than 5 minutes in the future).
  if (d.getFullYear() < 2020 || d.getTime() > Date.now() + 5 * 60 * 1000) return null;
  return d;
}

/**
 * Pull the payment instrument (UPI / card / netbanking / wallet) and the gateway's
 * own paid timestamp out of any Zoho payload shape (verify result, return URL,
 * webhook envelope). Everything is optional — callers must tolerate nulls.
 */
function extractPaymentDetails(payload) {
  const out = { method: null, detail: '', paidAt: null };
  if (!payload || typeof payload !== 'object') return out;

  const candidates = [];
  const push = (v) => {
    if (Array.isArray(v)) v.forEach(push);
    else if (v && typeof v === 'object') candidates.push(v);
  };
  const eo = payload.event_object && typeof payload.event_object === 'object' ? payload.event_object : {};
  const link = eo.payment_links || eo.payment_link || {};
  push(payload.raw && payload.raw.payments);
  push(payload.raw && payload.raw.payment);
  push(payload.payments);
  push(payload.payment);
  push(eo.payment);
  push(eo.payments);
  push(link.payments);
  push(payload);

  candidates.sort(
    (a, b) =>
      Number(isPaidStatus(normalizePaymentStatus(b))) -
      Number(isPaidStatus(normalizePaymentStatus(a)))
  );

  for (const c of candidates) {
    const pm = c.payment_method ?? c.payment_mode ?? c.payment_method_type ?? c.method ?? c.instrument;
    if (!out.method && pm != null && pm !== '') {
      let typeRaw = pm;
      let src = c;
      if (typeof pm === 'object') {
        typeRaw = firstString(pm.type, pm.name, pm.method, Object.keys(pm).find((k) => typeof pm[k] === 'object'));
        const nested = typeRaw && typeof pm[typeRaw] === 'object' ? pm[typeRaw] : {};
        src = { ...c, ...pm, ...nested };
      }
      const key = normalizeMethodKey(typeRaw);
      if (key) {
        out.method = key;
        out.detail = readMethodDetail(key, src);
      }
    }
    if (!out.paidAt) {
      out.paidAt = parseGatewayDate(
        c.paid_time ?? c.payment_time ?? c.paid_at ?? c.payment_date ?? c.date ?? c.created_time
      );
    }
    if (out.method && out.paidAt) break;
  }
  return out;
}

module.exports = {
  extractPaymentDetails,
  createPaymentOrder,
  createPaymentLink,
  verifyPayment,
  verifyReturnUrlSignature,
  verifyWebhookSignature,
  normalizeWebhookPayload,
  normalizeCurrency,
  isPaidStatus,
  normalizeZohoMode,
  getZohoRuntimeConfig,
};
