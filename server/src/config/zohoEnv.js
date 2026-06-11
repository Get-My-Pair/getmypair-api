/**
 * Zoho Payments environment validation and startup diagnostics.
 */
const config = require('./env');
const zohoOAuth = require('../services/zohoOAuth.service');
const logger = require('../utils/logger');

function getZohoConfigStatus() {
  const mock = config.ZOHO_PAYMENTS_MOCK === true;
  const accountId = String(config.ZOHO_ACCOUNT_ID || '').trim();
  const clientId = String(config.ZOHO_CLIENT_ID || '').trim();
  const apiKey = String(config.ZOHO_API_KEY || '').trim();
  const refreshToken = String(config.ZOHO_REFRESH_TOKEN || '').trim();
  const issues = [];
  const warnings = [];

  if (mock) {
    return {
      mode: 'mock',
      ready: true,
      issues,
      warnings: ['ZOHO_PAYMENTS_MOCK=true — mock checkout enabled (no live Zoho API calls).'],
    };
  }

  if (!accountId) {
    issues.push('ZOHO_ACCOUNT_ID is missing (Zoho Payments account ID).');
  }

  if (!clientId) {
    issues.push('ZOHO_CLIENT_ID is missing.');
  }

  if (!String(config.ZOHO_CLIENT_SECRET || '').trim()) {
    issues.push('ZOHO_CLIENT_SECRET is missing.');
  }

  if (clientId && apiKey && apiKey === clientId) {
    issues.push(
      'ZOHO_API_KEY is set to the OAuth Client ID. Use ZOHO_CLIENT_ID for the client id and generate a refresh token — do not put the client id in ZOHO_API_KEY.'
    );
  }

  if (!refreshToken && !zohoOAuth.hasStaticAccessToken()) {
    issues.push(
      'ZOHO_REFRESH_TOKEN is missing. Generate it once via Zoho OAuth (see server/scripts/zoho-oauth.js).'
    );
  }

  if (!String(config.ZOHO_PAYMENT_RETURN_URL || '').trim()) {
    warnings.push('ZOHO_PAYMENT_RETURN_URL is not set — Zoho may not redirect after payment.');
  }

  if (!mock && !String(config.ZOHO_SIGNING_KEY || '').trim()) {
    warnings.push(
      'ZOHO_SIGNING_KEY is not set — return URL signatures cannot be verified in production.'
    );
  }

  if (!mock && !String(config.ZOHO_WEBHOOK_SECRET || '').trim()) {
    warnings.push('ZOHO_WEBHOOK_SECRET is not set — webhook signatures cannot be verified.');
  }

  const baseUrl = String(config.ZOHO_PAYMENTS_BASE_URL || '');
  if (baseUrl.includes('sandbox') && !baseUrl.includes('paymentssandbox')) {
    warnings.push('Sandbox base URL should be https://paymentssandbox.zoho.in/api/v1');
  }

  const mode = zohoOAuth.hasOAuthRefreshFlow()
    ? 'oauth'
    : zohoOAuth.hasStaticAccessToken()
      ? 'static_token'
      : 'unconfigured';

  return {
    mode,
    ready: issues.length === 0 && zohoOAuth.isConfigured(),
    issues,
    warnings,
  };
}

function logZohoConfigStatus() {
  const status = getZohoConfigStatus();
  if (status.mode === 'mock') {
    logger.warn(`[Zoho] ${status.warnings[0]}`);
    return status;
  }

  if (status.ready) {
    logger.info(`[Zoho] Payments configured (${status.mode})`);
  } else {
    logger.error('[Zoho] Payments NOT ready for live checkout:');
    status.issues.forEach((issue) => logger.error(`  - ${issue}`));
  }

  status.warnings.forEach((warning) => logger.warn(`[Zoho] ${warning}`));
  return status;
}

module.exports = {
  getZohoConfigStatus,
  logZohoConfigStatus,
};
