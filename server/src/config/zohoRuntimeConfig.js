/**
 * Resolve Zoho Payments credentials per runtime mode (live vs sandbox).
 */
const config = require('./env');

function normalizeZohoMode(mode) {
  const value = String(mode || 'live').trim().toLowerCase();
  if (value === 'sandbox' || value === 'test') return 'sandbox';
  return 'live';
}

function getZohoRuntimeConfig(mode = 'live') {
  const normalized = normalizeZohoMode(mode);

  if (normalized === 'sandbox') {
    return {
      mode: 'sandbox',
      baseUrl:
        config.ZOHO_SANDBOX_PAYMENTS_BASE_URL ||
        'https://paymentssandbox.zoho.in/api/v1',
      accountId: String(config.ZOHO_SANDBOX_ACCOUNT_ID || '').trim(),
      clientId: String(config.ZOHO_SANDBOX_CLIENT_ID || '').trim(),
      clientSecret: String(config.ZOHO_SANDBOX_CLIENT_SECRET || '').trim(),
      refreshToken: String(config.ZOHO_SANDBOX_REFRESH_TOKEN || '').trim(),
      apiKey: String(config.ZOHO_SANDBOX_API_KEY || '').trim(),
      accountsUrl: String(
        config.ZOHO_SANDBOX_ACCOUNTS_URL || config.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.in'
      ).replace(/\/$/, ''),
      returnUrl: config.ZOHO_PAYMENT_RETURN_URL || '',
      isMock: false,
    };
  }

  return {
    mode: 'live',
    baseUrl: config.ZOHO_PAYMENTS_BASE_URL || 'https://payments.zoho.in/api/v1',
    accountId: String(config.ZOHO_ACCOUNT_ID || '').trim(),
    clientId: String(config.ZOHO_CLIENT_ID || '').trim(),
    clientSecret: String(config.ZOHO_CLIENT_SECRET || '').trim(),
    refreshToken: String(config.ZOHO_REFRESH_TOKEN || '').trim(),
    apiKey: String(config.ZOHO_API_KEY || '').trim(),
    accountsUrl: String(config.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.in').replace(/\/$/, ''),
    returnUrl: config.ZOHO_PAYMENT_RETURN_URL || '',
    isMock: config.ZOHO_PAYMENTS_MOCK === true || config.ZOHO_PAYMENTS_MOCK === 'true',
  };
}

function isRuntimeConfigured(runtime) {
  if (runtime.isMock) return true;
  const hasOAuth =
    runtime.clientId &&
    runtime.clientSecret &&
    runtime.refreshToken &&
    runtime.refreshToken.length <= 120 &&
    !/1a1b1c1d1e1f1g/i.test(runtime.refreshToken);
  const hasStatic =
    runtime.apiKey && (!runtime.clientId || runtime.apiKey !== runtime.clientId);
  return !!(hasOAuth || hasStatic);
}

module.exports = {
  normalizeZohoMode,
  getZohoRuntimeConfig,
  isRuntimeConfigured,
};
