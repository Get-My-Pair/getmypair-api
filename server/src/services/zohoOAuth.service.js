/**
 * Zoho Payments OAuth 2.0 — refresh access tokens for API calls.
 * Docs: https://www.zoho.com/in/payments/api/v1/authentication/
 */
const config = require('../config/env');
const logger = require('../utils/logger');

let cachedAccessToken = null;
let tokenExpiresAtMs = 0;
let refreshInFlight = null;

function hasOAuthRefreshFlow() {
  return !!(
    String(config.ZOHO_CLIENT_ID || '').trim() &&
    String(config.ZOHO_CLIENT_SECRET || '').trim() &&
    String(config.ZOHO_REFRESH_TOKEN || '').trim()
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
    refresh_token: config.ZOHO_REFRESH_TOKEN,
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
    const message =
      body.error_description ||
      body.error ||
      body.message ||
      `Zoho OAuth refresh failed (${res.status})`;
    const err = new Error(message);
    err.statusCode = 502;
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
    if (hasStaticAccessToken()) {
      return String(config.ZOHO_API_KEY).trim();
    }
    const err = new Error(
      'Zoho Payments credentials missing. Configure OAuth (ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN) or set ZOHO_PAYMENTS_MOCK=true for local testing.'
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

module.exports = {
  hasOAuthRefreshFlow,
  hasStaticAccessToken,
  isConfigured,
  getAccessToken,
  clearTokenCache,
  refreshAccessToken,
};
