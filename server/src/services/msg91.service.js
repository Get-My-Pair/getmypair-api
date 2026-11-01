/**
 * MSG91 OTP SMS — sends the server-generated code. Verification stays in otp.service.
 * Docs: query params on /api/v5/otp (mobile, template_id, otp, …); body is for extra template vars.
 * https://control.msg91.com/api/v5/otp
 *
 * "type":"success" only means MSG91 accepted the request — check OTP Logs in the
 * MSG91 dashboard for Delivered / Pending / Failed (India DLT is a common Pending cause).
 */
const config = require('../config/env');
const logger = require('../utils/logger');

let fetchFn = global.fetch;
if (!fetchFn) {
  try {
    // eslint-disable-next-line import/no-extraneous-dependencies
    fetchFn = require('node-fetch');
  } catch (err) {
    fetchFn = null;
  }
}

function isConfigured() {
  return Boolean(
    String(config.MSG91_AUTH_KEY || '').trim() &&
      String(config.MSG91_TEMPLATE_ID || '').trim()
  );
}

/** MSG91 expects country code + number, digits only (e.g. 9198xxxxxxxx). */
function toMsg91Mobile(mobile) {
  const digits = String(mobile || '').replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

async function sendOtpSms({ mobile, otp }) {
  if (!isConfigured()) {
    const err = new Error(
      'SMS delivery is not configured. Set MSG91_AUTH_KEY and MSG91_TEMPLATE_ID.'
    );
    err.statusCode = 503;
    throw err;
  }

  if (!fetchFn) {
    const err = new Error('Fetch API not available. Install node-fetch or run on Node 18+');
    err.statusCode = 500;
    throw err;
  }

  const msg91Mobile = toMsg91Mobile(mobile);
  if (!msg91Mobile || msg91Mobile.length < 12) {
    const err = new Error('Invalid mobile number for SMS');
    err.statusCode = 400;
    throw err;
  }

  const otpCode = String(otp);
  const otpExpiry = Number(config.OTP_EXPIRE_MINUTES) || 5;
  const otpLength = Number(config.OTP_LENGTH) || 6;
  const templateId = String(config.MSG91_TEMPLATE_ID).trim();

  // MSG91 Send OTP: mobile / template_id / otp belong in the query string.
  const url = new URL('https://control.msg91.com/api/v5/otp');
  url.searchParams.set('mobile', msg91Mobile);
  url.searchParams.set('template_id', templateId);
  url.searchParams.set('otp', otpCode);
  url.searchParams.set('otp_length', String(otpLength));
  url.searchParams.set('otp_expiry', String(otpExpiry));
  // Prefer live operator response over a cached accept.
  url.searchParams.set('realTimeResponse', '1');

  const response = await fetchFn(url.toString(), {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      authkey: config.MSG91_AUTH_KEY,
    },
    // Extra template variables only (##OTP## is filled from the otp query param).
    body: JSON.stringify({}),
  });

  let body = {};
  try {
    body = await response.json();
  } catch (_) {
    body = {};
  }

  const type = String(body.type || '').toLowerCase();
  const succeeded = response.ok && type === 'success';

  if (!succeeded) {
    logger.error(
      `MSG91 OTP send failed (${response.status}): ${JSON.stringify(body)}`
    );
    const err = new Error(body.message || 'Failed to send OTP SMS');
    err.statusCode = response.status >= 400 && response.status < 500 ? 400 : 502;
    throw err;
  }

  const requestId = body.request_id || body.requestId || null;
  logger.info(
    `MSG91 accepted OTP for ${msg91Mobile} request_id=${requestId || 'n/a'} ` +
      `(API success ≠ handset delivery — check MSG91 OTP Logs / DLT)`
  );

  return { requestId, raw: body };
}

module.exports = {
  isConfigured,
  sendOtpSms,
};
