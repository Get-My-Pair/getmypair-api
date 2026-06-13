/**
 * Zoho Payments integration — create orders, payment links, verify status.
 * India API docs: https://www.zoho.com/in/payments/api/v1/payment-links/
 * Live Zoho Payments only — set ZOHO_PAYMENTS_MOCK=true only for offline dev.
 */
const crypto = require('crypto');
const config = require('../config/env');
const {
  getZohoRuntimeConfig,
  normalizeZohoMode,
  resolveEffectiveRuntime,
} = require('../config/zohoRuntimeConfig');
const logger = require('../utils/logger');
const zohoOAuth = require('./zohoOAuth.service');

const isMock = () =>
  config.ZOHO_PAYMENTS_MOCK === true || config.ZOHO_PAYMENTS_MOCK === 'true';

function assertLiveZohoConfigured(runtime) {
  if (runtime.isMock) return;
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

function logSandboxMockFallback(runtime) {
  if (!runtime.mockFallback) return;
  logger.warn(
    '[Zoho:sandbox] ZOHO_SANDBOX_* credentials not set — using internal mock checkout. ' +
      'Add sandbox OAuth credentials from paymentssandbox.zoho.in for real Zoho sandbox checkout.'
  );
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
  return ['paid', 'success', 'captured', 'completed', 'succeeded'].includes(
    String(status || '').toLowerCase()
  );
}

/**
 * Create a payment order in Zoho (or mock).
 */
async function createPaymentOrder({
  orderId,
  amount,
  currency,
  customer,
  description,
  mode = 'live',
}) {
  const runtime = resolveEffectiveRuntime(mode);
  logSandboxMockFallback(runtime);
  assertLiveZohoConfigured(runtime);
  if (runtime.isMock) {
    return {
      order_id: `mock_order_${orderId}`,
      amount: normalizeAmount(amount),
      currency: normalizeCurrency(currency),
      status: 'created',
      mock: true,
      mockFallback: !!runtime.mockFallback,
      zohoMode: runtime.mode,
    };
  }

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
  const runtime = resolveEffectiveRuntime(mode);
  logSandboxMockFallback(runtime);
  assertLiveZohoConfigured(runtime);
  if (runtime.isMock) {
    const base = config.API_PUBLIC_BASE_URL || `http://localhost:${config.PORT}`;
    const amt = normalizeAmount(amount);
    return {
      payment_link_id: `mock_link_${orderId}`,
      url: `${base}/api/payment/mock-checkout?orderId=${encodeURIComponent(orderId)}&amount=${amt}`,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      mock: true,
      mockFallback: !!runtime.mockFallback,
      zohoMode: runtime.mode,
    };
  }

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
  forceMock = false,
}) {
  const runtime = resolveEffectiveRuntime(mode, { forceMock });
  assertLiveZohoConfigured(runtime);
  if (runtime.isMock) {
    return {
      status: 'paid',
      reference_id: orderId,
      payment_id: zohoPaymentId || `mock_pay_${orderId}`,
      mock: true,
    };
  }

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
    if (isPaidStatus(linkStatus)) {
      return {
        status: 'paid',
        payment_status: linkStatus,
        reference_id: link.reference_id || orderId,
        payment_id: link.payment_id || zohoPaymentId,
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
  verifyReturnUrlSignature,
  verifyWebhookSignature,
  isMock,
  normalizeCurrency,
  isPaidStatus,
  normalizeZohoMode,
  resolveEffectiveRuntime,
};
