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
const fs = require('fs');
const path = require('path');

const ENV_PATH = path.join(__dirname, '..', '.env');
require('dotenv').config({ path: ENV_PATH });

const config = require('../src/config/env');
const zohoOAuth = require('../src/services/zohoOAuth.service');

function writeRefreshTokenToEnv(refreshToken) {
  let content = fs.readFileSync(ENV_PATH, 'utf8');
  const line = `ZOHO_REFRESH_TOKEN=${refreshToken}`;
  if (/^ZOHO_REFRESH_TOKEN=.*$/m.test(content)) {
    content = content.replace(/^ZOHO_REFRESH_TOKEN=.*$/m, line);
  } else {
    content += `\n${line}\n`;
  }
  if (/^ZOHO_PAYMENTS_MOCK=.*$/m.test(content)) {
    content = content.replace(/^ZOHO_PAYMENTS_MOCK=.*$/m, 'ZOHO_PAYMENTS_MOCK=false');
  }
  fs.writeFileSync(ENV_PATH, content, 'utf8');
  process.env.ZOHO_REFRESH_TOKEN = refreshToken;
  process.env.ZOHO_PAYMENTS_MOCK = 'false';
}

const LIVE_SCOPES = [
  'ZohoPay.payments.CREATE',
  'ZohoPay.payments.READ',
  'ZohoPay.payments.UPDATE',
].join(',');

const SANDBOX_SCOPES = [
  'ZohoPaySandbox.payments.CREATE',
  'ZohoPaySandbox.payments.READ',
  'ZohoPaySandbox.payments.UPDATE',
].join(',');

function isSandboxMode() {
  return String(process.env.ZOHO_PAYMENTS_BASE_URL || config.ZOHO_PAYMENTS_BASE_URL || '').includes(
    'paymentssandbox'
  );
}

function getOAuthScopes() {
  return isSandboxMode() ? SANDBOX_SCOPES : LIVE_SCOPES;
}

function getPaymentsApiBase() {
  const base = String(
    process.env.ZOHO_PAYMENTS_BASE_URL || config.ZOHO_PAYMENTS_BASE_URL || ''
  ).replace(/\/$/, '');
  return base || 'https://payments.zoho.in/api/v1';
}

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
  const sandbox = isSandboxMode();
  const soid = sandbox ? `zohopaysandbox.${accountId}` : `zohopay.${accountId}`;
  const scope = getOAuthScopes();

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

/**
 * Self Client grant-code exchange (no redirect_uri).
 * @see https://www.zoho.com/in/payments/api/v1/oauth/
 */
async function exchangeSelfClientCode(code) {
  const clientId = requireEnv('ZOHO_CLIENT_ID');
  const clientSecret = requireEnv('ZOHO_CLIENT_SECRET');
  const accountsUrl = (process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.in').replace(
    /\/$/,
    ''
  );

  const params = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'authorization_code',
  });

  const res = await fetch(`${accountsUrl}/oauth/v2/token?${params.toString()}`, {
    method: 'POST',
  });
  const body = await res.json();
  if (!res.ok || body.error) {
    console.error('Self Client token exchange failed:', body);
    if (body.error === 'invalid_client') {
      console.error(
        '\nTip: ZOHO_CLIENT_ID and ZOHO_CLIENT_SECRET must be from the SAME Self Client\n' +
          'that generated the grant code (Client Secret tab in api-console.zoho.in).'
      );
    }
    process.exit(1);
  }

  writeRefreshTokenToEnv(body.refresh_token);

  console.log('\nSaved to server/.env:\n');
  console.log(`ZOHO_CLIENT_ID=${clientId}`);
  console.log(`ZOHO_CLIENT_SECRET=${clientSecret}`);
  console.log(`ZOHO_REFRESH_TOKEN=${body.refresh_token}`);
  console.log('ZOHO_PAYMENTS_MOCK=false');
  console.log('\nAlso add these to Render environment variables, then redeploy.');
  console.log('\nVerify with: node scripts/zoho-oauth.js test');
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

  writeRefreshTokenToEnv(body.refresh_token);

  console.log('\nSaved to server/.env:\n');
  console.log(`ZOHO_REFRESH_TOKEN=${body.refresh_token}`);
  console.log('ZOHO_PAYMENTS_MOCK=false');
  console.log('\nAlso add ZOHO_REFRESH_TOKEN to Render environment variables, then redeploy.');
  console.log('\nVerify with: node scripts/zoho-oauth.js test');
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
  const sandbox = isSandboxMode();

  console.log('\nZoho Payments configuration\n');
  console.log(`  ZOHO_ACCOUNT_ID:        ${config.ZOHO_ACCOUNT_ID || '(not set)'}`);
  console.log(`  ZOHO_PAYMENTS_BASE_URL: ${getPaymentsApiBase()}`);
  console.log(`  ZOHO_CLIENT_ID:         ${mask(config.ZOHO_CLIENT_ID)}`);
  console.log(`  ZOHO_CLIENT_SECRET:     ${mask(config.ZOHO_CLIENT_SECRET)}`);
  console.log(`  ZOHO_REFRESH_TOKEN:     ${refreshToken ? mask(refreshToken) : '(not set)'}`);
  console.log(`  ZOHO_PAYMENTS_MOCK:     ${mock}`);
  console.log(`  ZOHO_REDIRECT_URI:      ${config.ZOHO_REDIRECT_URI || '(not set)'}`);
  console.log(`  Self Client scopes:     ${getOAuthScopes()}`);

  console.log('\nStatus\n');
  if (mock) {
    console.log('  Mode: internal mock (ZOHO_PAYMENTS_MOCK=true — no Zoho API calls).');
  } else if (sandbox) {
    console.log('  Mode: Zoho Payments SANDBOX (test cards/UPI — no real money).');
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

  const accountId = requireEnv('ZOHO_ACCOUNT_ID');
  const apiBase = getPaymentsApiBase();
  const res = await fetch(
    `${apiBase}/paymentlinks?account_id=${encodeURIComponent(accountId)}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: 1,
        currency: 'INR',
        reference_id: `oauth-test-${Date.now()}`,
        description: 'GetMyPair OAuth connectivity test',
        return_url: requireEnv('ZOHO_PAYMENT_RETURN_URL'),
      }),
    }
  );
  const body = await res.json();
  if (!res.ok) {
    console.error('Payment link test failed:', body);
    process.exit(1);
  }
  const link = body.payment_links || body.payment_link || body;
  console.log('Payment link API OK — test URL created:', link.url || '(url in response)');
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
} else if (command === 'exchange-self') {
  if (!codeArg) {
    console.error('Usage: node scripts/zoho-oauth.js exchange-self --code=1000.xxx');
    process.exit(1);
  }
  exchangeSelfClientCode(codeArg).catch((err) => {
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
  console.log('\nCommands: status | auth-url | exchange --code=... | exchange-self --code=... | test');
  process.exit(1);
}
