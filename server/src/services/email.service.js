/**
 * Portal email delivery — Resend.com first, SMTP fallback, then logger.
 */
const { Resend } = require('resend');
const nodemailer = require('nodemailer');
const config = require('../config/env');
const logger = require('../utils/logger');

let resendClient;
let smtpTransporter;

function resendConfigured() {
  return Boolean(String(config.RESEND_API_KEY || '').trim());
}

function smtpConfigured() {
  return Boolean(String(config.SMTP_USER || '').trim() && String(config.SMTP_PASS || '').trim());
}

function getResend() {
  if (!resendConfigured()) return null;
  if (!resendClient) {
    resendClient = new Resend(config.RESEND_API_KEY);
  }
  return resendClient;
}

function getSmtpTransporter() {
  if (!smtpConfigured()) return null;
  if (!smtpTransporter) {
    smtpTransporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: Number(config.SMTP_PORT) === 465,
      auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS,
      },
    });
  }
  return smtpTransporter;
}

function fromAddress() {
  return (
    config.RESEND_FROM_EMAIL ||
    process.env.SMTP_FROM ||
    process.env.MAIL_FROM ||
    config.SMTP_USER ||
    'GetMyPair <onboarding@resend.dev>'
  );
}

function buildOtpContent({ otp, portalLabel, minutes }) {
  const subject = `GetMyPair ${portalLabel} verification code`;
  const text = [
    `Your GetMyPair ${portalLabel} login verification code is: ${otp}`,
    '',
    `This code expires in ${minutes} minute(s).`,
    'If you did not request this, ignore this email.',
  ].join('\n');
  const html = `
    <div style="font-family:Montserrat,Arial,sans-serif;line-height:1.5;color:#12222a;max-width:480px">
      <p style="margin:0 0 4px;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#5f7378">GetMyPair</p>
      <h1 style="margin:0 0 16px;font-size:22px;color:#0f5c63">${portalLabel} login code</h1>
      <p style="margin:0 0 12px">Use this one-time code to finish signing in:</p>
      <p style="margin:0 0 16px;font-size:32px;letter-spacing:0.28em;font-weight:700;color:#102428">${otp}</p>
      <p style="margin:0;color:#5f7378;font-size:14px">Expires in ${minutes} minute(s). If you did not request this, ignore this email.</p>
    </div>
  `;
  return { subject, text, html };
}

async function sendViaResend({ to, subject, text, html }) {
  const client = getResend();
  if (!client) return null;

  const { data, error } = await client.emails.send({
    from: fromAddress(),
    to: [to],
    subject,
    text,
    html,
  });

  if (error) {
    throw new Error(error.message || 'Resend API error');
  }

  return data?.id || true;
}

async function sendViaSmtp({ to, subject, text, html }) {
  const transport = getSmtpTransporter();
  if (!transport) return null;

  await transport.sendMail({
    from: fromAddress(),
    to,
    subject,
    text,
    html,
  });
  return true;
}

/**
 * Send a portal login OTP email.
 * @returns {{ delivered: boolean, mode: 'resend'|'smtp'|'log' }}
 */
async function sendAdminLoginOtp({ to, otp, portalLabel }) {
  const minutes = config.OTP_EXPIRE_MINUTES || 5;
  const { subject, text, html } = buildOtpContent({ otp, portalLabel, minutes });

  if (resendConfigured()) {
    try {
      const id = await sendViaResend({ to, subject, text, html });
      logger.info(`[email] Portal OTP sent via Resend to ${to} (${portalLabel}) id=${id}`);
      return { delivered: true, mode: 'resend' };
    } catch (err) {
      logger.error(`[email] Resend failed for ${to}: ${err.message}`);
    }
  }

  if (smtpConfigured()) {
    try {
      await sendViaSmtp({ to, subject, text, html });
      logger.info(`[email] Portal OTP sent via SMTP to ${to} (${portalLabel})`);
      return { delivered: true, mode: 'smtp' };
    } catch (err) {
      logger.error(`[email] SMTP failed for ${to}: ${err.message}`);
    }
  }

  logger.info(`[email] No mail provider delivered — portal OTP for ${to}: ${otp}`);
  return { delivered: false, mode: 'log' };
}

module.exports = {
  resendConfigured,
  smtpConfigured,
  sendAdminLoginOtp,
};
