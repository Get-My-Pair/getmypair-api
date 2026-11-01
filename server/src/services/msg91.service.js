/**
 * MSG91 transactional SMS via Flow API (not SendOTP).
 * Server generates the login code; this service only delivers it as SMS.
 * Verify stays in otp.service — never call MSG91 verify.
 *
 * POST https://api.msg91.com/api/v5/flow/
 * Docs: https://api.msg91.com/apidoc/textsms/send-sms-flow.php
 *
 * Dashboard: SMS → Templates/Flow (DLT-mapped). Logs: SMS → Logs (not OTP Logs).
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

/** Flow / SMS template id (MSG91_FLOW_ID or legacy MSG91_TEMPLATE_ID). */
function flowId() {
  return String(
    config.MSG91_FLOW_ID || config.MSG91_TEMPLATE_ID || ''
  ).trim();
}

function isConfigured() {
  return Boolean(String(config.MSG91_AUTH_KEY || '').trim() && flowId());
}

/** MSG91 expects country code + number, digits only (e.g. 9198xxxxxxxx). */
function toMsg91Mobile(mobile) {
  const digits = String(mobile || '').replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

/**
 * Send login code via MSG91 Flow SMS.
 * Template variable name defaults to OTP (##OTP## in the flow). Override with MSG91_OTP_VAR.
 */
async function sendOtpSms({ mobile, otp }) {
  if (!isConfigured()) {
    const err = new Error(
      'SMS delivery is not configured. Set MSG91_AUTH_KEY and MSG91_FLOW_ID (or MSG91_TEMPLATE_ID).'
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
  const varName = String(config.MSG91_OTP_VAR || 'OTP').trim() || 'OTP';
  const sender = String(config.MSG91_SENDER_ID || '').trim();

  const recipient = {
    mobiles: msg91Mobile,
    [varName]: otpCode,
  };

  const payload = {
    flow_id: flowId(),
    recipients: [recipient],
  };
  // Only when the flow sender is "FromAPI".
  if (sender) {
    payload.sender = sender;
  }

  const response = await fetchFn('https://api.msg91.com/api/v5/flow/', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      authkey: config.MSG91_AUTH_KEY,
    },
    body: JSON.stringify(payload),
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
      `MSG91 Flow SMS failed (${response.status}): ${JSON.stringify(body)}`
    );
    const err = new Error(body.message || 'Failed to send SMS');
    err.statusCode = response.status >= 400 && response.status < 500 ? 400 : 502;
    throw err;
  }

  // Flow success payload: { type: "success", message: "<request_id>" }
  const requestId =
    body.request_id ||
    body.requestId ||
    (typeof body.message === 'string' && body.message.length < 64
      ? body.message
      : null);

  logger.info(
    `MSG91 Flow SMS accepted for ${msg91Mobile} request_id=${requestId || 'n/a'} ` +
      `(check MSG91 → SMS → Logs / DLT for handset delivery)`
  );

  return { requestId, raw: body };
}

module.exports = {
  isConfigured,
  sendOtpSms,
};
