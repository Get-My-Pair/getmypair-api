/**
 * Zoho Payments OAuth 2.0 — refresh access tokens for API calls.
 * Docs: https://www.zoho.com/in/payments/api/v1/authentication/
 */
const config = require('../config/env');
const logger = require('../utils/logger');

let cachedAccessToken = null;
let tokenExpiresAtMs = 0;
let refreshInFlight = null;

function isPlaceholderRefreshToken(token) {
  const t = String(token || '').trim();
  if (!t) return false;
  if (/1a1b1c1d1e1f1g/i.test(t)) return true;
  if (/your[_-]?refresh/i.test(t)) return true;
  if (t.length > 120) return true;
  return false;
}

function getRefreshToken() {
  return String(process.env.ZOHO_REFRESH_TOKEN || config.ZOHO_REFRESH_TOKEN || '').trim();
}

function hasOAuthRefreshFlow() {
  const refreshToken = getRefreshToken();
  return !!(
    String(config.ZOHO_CLIENT_ID || '').trim() &&
    String(config.ZOHO_CLIENT_SECRET || '').trim() &&
    refreshToken &&
    !isPlaceholderRefreshToken(refreshToken)
  );
}

function hasStaticAccessToken() {
  const token = String(config.ZOHO_API_KEY || '').trim();
  const clientId = String(config.ZOHO_CLIENT_ID || '').trim();
  if (!token) return false;
  if (clientId && token === clientId) return false;
  if (token.includes('xxxxxxxx') || token.includes('your_')) return false;
  return true;
}

function isConfigured() {
  return hasOAuthRefreshFlow() || hasStaticAccessToken();
}

function clearTokenCache() {
  cachedAccessToken = null;
  tokenExpiresAtMs = 0;
}

async function refreshAccessToken() {
  if (!hasOAuthRefreshFlow()) {
    const err = new Error(
      'Zoho OAuth is not configured. Set ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, and ZOHO_REFRESH_TOKEN in server/.env'
    );
    err.statusCode = 503;
    throw err;
  }

  const accountsUrl = String(config.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.in').replace(
    /\/$/,
    ''
  );
  const params = new URLSearchParams({
    refresh_token: getRefreshToken(),
    client_id: config.ZOHO_CLIENT_ID,
    client_secret: config.ZOHO_CLIENT_SECRET,
    grant_type: 'refresh_token',
  });

  const res = await fetch(`${accountsUrl}/oauth/v2/token?${params.toString()}`, {
    method: 'POST',
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }

  if (!res.ok || body.error) {
    const zohoError = String(body.error || '').toLowerCase();
    if (
      (zohoError === 'invalid_code' || zohoError === 'invalid_grant') &&
      hasStaticAccessToken()
    ) {
      logger.warn(
        '[Zoho] Refresh token rejected — falling back to ZOHO_API_KEY access token'
      );
      return String(config.ZOHO_API_KEY).trim();
    }

    const message =
      body.error_description ||
      body.error ||
      body.message ||
      `Zoho OAuth refresh failed (${res.status})`;
    const err = new Error(
      `${message}. Generate a new refresh token: node scripts/zoho-oauth.js auth-url`
    );
    err.statusCode = 503;
    err.body = body;
    throw err;
  }

  const accessToken = String(body.access_token || '').trim();
  if (!accessToken) {
    const err = new Error('Zoho OAuth refresh did not return an access_token');
    err.statusCode = 502;
    err.body = body;
    throw err;
  }

  const expiresInSec = Number(body.expires_in) || 3600;
  cachedAccessToken = accessToken;
  tokenExpiresAtMs = Date.now() + expiresInSec * 1000;
  logger.info('[Zoho] OAuth access token refreshed');
  return accessToken;
}

async function getAccessToken({ forceRefresh = false } = {}) {
  if (!forceRefresh && hasStaticAccessToken() && !hasOAuthRefreshFlow()) {
    return String(config.ZOHO_API_KEY).trim();
  }

  if (!hasOAuthRefreshFlow()) {
    const refreshToken = getRefreshToken();
    if (refreshToken && isPlaceholderRefreshToken(refreshToken)) {
      const err = new Error(
        'ZOHO_REFRESH_TOKEN is a placeholder, not a real Zoho token. Run: node scripts/zoho-oauth.js auth-url'
      );
      err.statusCode = 503;
      throw err;
    }
    if (hasStaticAccessToken()) {
      return String(config.ZOHO_API_KEY).trim();
    }
    const err = new Error(
      'Zoho Payments OAuth not configured. Run: node scripts/zoho-oauth.js auth-url — then add ZOHO_REFRESH_TOKEN to server/.env and Render env vars.'
    );
    err.statusCode = 503;
    throw err;
  }

  const now = Date.now();
  if (!forceRefresh && cachedAccessToken && tokenExpiresAtMs > now + 60_000) {
    return cachedAccessToken;
  }

  if (!refreshInFlight) {
    refreshInFlight = refreshAccessToken().finally(() => {
      refreshInFlight = null;
    });
  }

  return refreshInFlight;
}

/**
 * Exchange one-time OAuth authorization code for refresh + access tokens.
 */
async function exchangeAuthorizationCode(code) {
  const authCode = String(code || '').trim();
  if (!authCode) {
    const err = new Error('Authorization code is required');
    err.statusCode = 400;
    throw err;
  }

  const accountsUrl = String(config.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.in').replace(
    /\/$/,
    ''
  );
  const redirectUri = String(
    config.ZOHO_REDIRECT_URI || config.ZOHO_PAYMENT_RETURN_URL || ''
  ).trim();

  const params = new URLSearchParams({
    code: authCode,
    client_id: config.ZOHO_CLIENT_ID,
    client_secret: config.ZOHO_CLIENT_SECRET,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const res = await fetch(`${accountsUrl}/oauth/v2/token?${params.toString()}`, {
    method: 'POST',
  });
  const body = await res.json().catch(() => ({}));

  if (!res.ok || body.error) {
    const err = new Error(
      body.error_description || body.error || `OAuth code exchange failed (${res.status})`
    );
    err.statusCode = 502;
    err.body = body;
    throw err;
  }

  const refreshToken = String(body.refresh_token || '').trim();
  const accessToken = String(body.access_token || '').trim();
  if (!refreshToken) {
    const err = new Error('Zoho did not return a refresh_token — use access_type=offline');
    err.statusCode = 502;
    err.body = body;
    throw err;
  }

  process.env.ZOHO_REFRESH_TOKEN = refreshToken;
  if (accessToken) {
    cachedAccessToken = accessToken;
    tokenExpiresAtMs = Date.now() + (Number(body.expires_in) || 3600) * 1000;
  }

  logger.info('[Zoho] OAuth authorization code exchanged — refresh token stored for this process');
  return { refreshToken, accessToken, expiresIn: body.expires_in };
}

function isOAuthRedirectQuery(query = {}) {
  const code = String(query.code || '').trim();
  if (!code) return false;
  return !(
    query.payment_link_id ||
    query.payment_id ||
    query.payment_link_reference ||
    query.status
  );
}

module.exports = {
  hasOAuthRefreshFlow,
  hasStaticAccessToken,
  isConfigured,
  getAccessToken,
  clearTokenCache,
  refreshAccessToken,
  exchangeAuthorizationCode,
  isOAuthRedirectQuery,
  getRefreshToken,
};
