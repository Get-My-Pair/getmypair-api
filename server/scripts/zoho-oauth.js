#!/usr/bin/env node
/**
 * Zoho Payments OAuth helper.
 *
 * 1) Print authorization URL:
 *    node scripts/zoho-oauth.js auth-url
 *
 * 2) Exchange authorization code for refresh token:
 *    node scripts/zoho-oauth.js exchange --code=1000.xxx
 *
 * 3) Test refresh + payment link auth:
 *    node scripts/zoho-oauth.js test
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const config = require('../src/config/env');
const zohoOAuth = require('../src/services/zohoOAuth.service');

const SCOPES = [
  'ZohoPay.payments.CREATE',
  'ZohoPay.payments.READ',
  'ZohoPay.payments.UPDATE',
].join(',');

function requireEnv(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) {
    console.error(`Missing ${name} in server/.env`);
    process.exit(1);
  }
  return value;
}

function printAuthUrl() {
  const clientId = requireEnv('ZOHO_CLIENT_ID');
  const accountId = requireEnv('ZOHO_ACCOUNT_ID');
  const redirectUri = requireEnv('ZOHO_REDIRECT_URI');
  const accountsUrl = (process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.in').replace(
    /\/$/,
    ''
  );
  const isSandbox = String(process.env.ZOHO_PAYMENTS_BASE_URL || '').includes('sandbox');
  const soid = isSandbox ? `zohopaysandbox.${accountId}` : `zohopay.${accountId}`;
  const scope = isSandbox
    ? SCOPES.replace(/ZohoPay\./g, 'ZohoPaySandbox.')
    : SCOPES;

  const params = new URLSearchParams({
    scope,
    client_id: clientId,
    soid,
    response_type: 'code',
    redirect_uri: redirectUri,
    access_type: 'offline',
    state: 'getmypair-zoho-oauth',
  });

  const url = `${accountsUrl}/oauth/v2/org/auth?${params.toString()}`;
  console.log('\nOpen this URL in a browser (Account Owner / Admin only):\n');
  console.log(url);
  console.log('\nAfter accepting, copy the `code` query param from the redirect URL.');
  console.log('Then run:\n  node scripts/zoho-oauth.js exchange --code=YOUR_CODE\n');
}

async function exchangeCode(code) {
  const clientId = requireEnv('ZOHO_CLIENT_ID');
  const clientSecret = requireEnv('ZOHO_CLIENT_SECRET');
  const redirectUri = requireEnv('ZOHO_REDIRECT_URI');
  const accountsUrl = (process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.in').replace(
    /\/$/,
    ''
  );

  const params = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const res = await fetch(`${accountsUrl}/oauth/v2/token?${params.toString()}`, {
    method: 'POST',
  });
  const body = await res.json();
  if (!res.ok || body.error) {
    console.error('Token exchange failed:', body);
    process.exit(1);
  }

  console.log('\nAdd this to server/.env:\n');
  console.log(`ZOHO_REFRESH_TOKEN=${body.refresh_token}`);
  console.log(`ZOHO_PAYMENTS_MOCK=false`);
  console.log('\nAccess token (expires in ~1 hour — server refreshes automatically):');
  console.log(body.access_token);
}

function mask(value) {
  const text = String(value || '').trim();
  if (!text) return '(not set)';
  if (text.length <= 8) return '***';
  return `${text.slice(0, 6)}…${text.slice(-4)}`;
}

function printStatus() {
  const refreshToken = String(process.env.ZOHO_REFRESH_TOKEN || '').trim();
  const mock = config.ZOHO_PAYMENTS_MOCK === true;

  console.log('\nZoho Payments configuration\n');
  console.log(`  ZOHO_ACCOUNT_ID:     ${config.ZOHO_ACCOUNT_ID || '(not set)'}`);
  console.log(`  ZOHO_CLIENT_ID:      ${mask(config.ZOHO_CLIENT_ID)}`);
  console.log(`  ZOHO_CLIENT_SECRET:  ${mask(config.ZOHO_CLIENT_SECRET)}`);
  console.log(`  ZOHO_REFRESH_TOKEN:  ${refreshToken ? mask(refreshToken) : '(not set)'}`);
  console.log(`  ZOHO_PAYMENTS_MOCK:  ${mock}`);
  console.log(`  ZOHO_REDIRECT_URI:   ${config.ZOHO_REDIRECT_URI || '(not set)'}`);

  console.log('\nStatus\n');
  if (mock) {
    console.log('  Mode: mock checkout (payments work locally without live Zoho API).');
  } else if (refreshToken) {
    console.log('  Mode: live Zoho Payments (refresh token present).');
  } else {
    console.log('  Mode: live requested but OAuth is incomplete.');
  }

  console.log('\nNext steps\n');
  if (!refreshToken) {
    console.log('  1. node scripts/zoho-oauth.js auth-url');
    console.log('  2. Open the URL, accept access, copy `code` from redirect URL');
    console.log('  3. node scripts/zoho-oauth.js exchange --code=PASTE_CODE');
    console.log('  4. Paste ZOHO_REFRESH_TOKEN into server/.env');
    console.log('  5. Set ZOHO_PAYMENTS_MOCK=false');
    console.log('  6. node scripts/zoho-oauth.js test');
  } else if (mock) {
    console.log('  OAuth is ready. Set ZOHO_PAYMENTS_MOCK=false to use live Zoho.');
    console.log('  Then run: node scripts/zoho-oauth.js test');
  } else {
    console.log('  Run: node scripts/zoho-oauth.js test');
  }
  console.log('');
}

async function testAuth() {
  const refreshToken = String(process.env.ZOHO_REFRESH_TOKEN || '').trim();
  if (!refreshToken) {
    console.error(
      'Cannot run test yet: ZOHO_REFRESH_TOKEN is empty in server/.env.\n\n' +
        'Run these first:\n' +
        '  node scripts/zoho-oauth.js auth-url\n' +
        '  node scripts/zoho-oauth.js exchange --code=YOUR_CODE\n'
    );
    process.exit(1);
  }

  const token = await zohoOAuth.getAccessToken({ forceRefresh: true });
  console.log('OAuth access token OK (first 12 chars):', `${token.slice(0, 12)}…`);
}

const [command, ...rest] = process.argv.slice(2);
const codeArg = rest.find((arg) => arg.startsWith('--code='))?.split('=').slice(1).join('=');

if (command === 'auth-url') {
  printAuthUrl();
} else if (command === 'exchange') {
  if (!codeArg) {
    console.error('Usage: node scripts/zoho-oauth.js exchange --code=1000.xxx');
    process.exit(1);
  }
  exchangeCode(codeArg).catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
} else if (command === 'test') {
  testAuth().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
} else if (command === 'status' || !command) {
  printStatus();
} else {
  console.error(`Unknown command: ${command}`);
  console.log('\nCommands: status | auth-url | exchange --code=... | test');
  process.exit(1);
}
