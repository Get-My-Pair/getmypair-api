/**
 * Portal email delivery — Resend.com first, SMTP fallback, then logger.
 */
const { Resend } = require('resend');
const nodemailer = require('nodemailer');
const config = require('../config/env');
const logger = require('../utils/logger');
const {
  buildOtpContent,
  buildRegistrationReceivedContent,
  buildCredentialsContent,
  buildDeliveryMemberCredentials,
  listEmailTemplates,
} = require('./email.templates');

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

async function deliverEmail({ to, subject, text, html, logLabel }) {
  let lastError = '';

  if (resendConfigured()) {
    try {
      const id = await sendViaResend({ to, subject, text, html });
      logger.info(`[email] ${logLabel} sent via Resend to ${to} id=${id}`);
      return { delivered: true, mode: 'resend' };
    } catch (err) {
      lastError = err.message || 'Resend API error';
      logger.error(`[email] Resend failed for ${to}: ${lastError}`);
    }
  }

  if (smtpConfigured()) {
    try {
      await sendViaSmtp({ to, subject, text, html });
      logger.info(`[email] ${logLabel} sent via SMTP to ${to}`);
      return { delivered: true, mode: 'smtp' };
    } catch (err) {
      lastError = err.message || 'SMTP error';
      logger.error(`[email] SMTP failed for ${to}: ${lastError}`);
    }
  }

  logger.info(`[email] No mail provider delivered — ${logLabel} for ${to}`);
  return { delivered: false, mode: 'log', error: lastError || 'No email provider configured' };
}

/**
 * Send a portal login OTP email.
 * @returns {{ delivered: boolean, mode: 'resend'|'smtp'|'log' }}
 */
async function sendAdminLoginOtp({ to, otp, portalLabel }) {
  const minutes = config.OTP_EXPIRE_MINUTES || 5;
  const { subject, text, html } = buildOtpContent({ otp, portalLabel, minutes });
  return deliverEmail({ to, subject, text, html, logLabel: `Portal OTP (${portalLabel})` });
}

/**
 * Acknowledge a public Darkworkstore registration.
 */
async function sendDarkworkstoreRegistrationReceived({ to, name, storeName }) {
  const { subject, text, html } = buildRegistrationReceivedContent({ name, storeName });
  return deliverEmail({
    to,
    subject,
    text,
    html,
    logLabel: 'Darkworkstore registration received',
  });
}

/**
 * Send verified Darkworkstore login credentials + dashboard link.
 */
async function sendDarkworkstoreCredentials({ to, name, storeName, email, password, loginUrl }) {
  const { subject, text, html } = buildCredentialsContent({
    name,
    storeName,
    email,
    password,
    loginUrl,
  });
  return deliverEmail({
    to,
    subject,
    text,
    html,
    logLabel: 'Darkworkstore credentials',
  });
}

async function sendDeliveryMemberCredentials({ to, name, email, password, loginUrl }) {
  const { subject, text, html } = buildDeliveryMemberCredentials({
    name,
    email,
    password,
    loginUrl,
  });
  return deliverEmail({
    to,
    subject,
    text,
    html,
    logLabel: 'Delivery member credentials',
  });
}

module.exports = {
  resendConfigured,
  smtpConfigured,
  sendAdminLoginOtp,
  sendDarkworkstoreRegistrationReceived,
  sendDarkworkstoreCredentials,
  sendDeliveryMemberCredentials,
  listEmailTemplates,
};
