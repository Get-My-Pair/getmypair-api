/**
 * MSG91 OTP SMS — sends the server-generated code. Verification stays in otp.service.
 * https://docs.msg91.com/reference/send-otp
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

  const response = await fetchFn('https://control.msg91.com/api/v5/otp', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      authkey: config.MSG91_AUTH_KEY,
    },
    body: JSON.stringify({
      template_id: config.MSG91_TEMPLATE_ID,
      mobile: msg91Mobile,
      otp: String(otp),
      otp_expiry: config.OTP_EXPIRE_MINUTES || 5,
    }),
  });

  let body = {};
  try {
    body = await response.json();
  } catch (_) {
    body = {};
  }

  const succeeded =
    response.ok && String(body.type || '').toLowerCase() === 'success';

  if (!succeeded) {
    logger.error(
      `MSG91 OTP send failed (${response.status}): ${body.message || body.type || 'unknown error'}`
    );
    const err = new Error(body.message || 'Failed to send OTP SMS');
    err.statusCode = response.status >= 400 && response.status < 500 ? 400 : 502;
    throw err;
  }

  return { requestId: body.request_id || null };
}

module.exports = {
  isConfigured,
  sendOtpSms,
};
