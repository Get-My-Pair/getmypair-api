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

function wrapHtml({ title, bodyHtml }) {
  return `
    <div style="font-family:Montserrat,Arial,sans-serif;line-height:1.5;color:#12222a;max-width:520px">
      <p style="margin:0 0 4px;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#5f7378">GetMyPair</p>
      <h1 style="margin:0 0 16px;font-size:22px;color:#0f5c63">${title}</h1>
      ${bodyHtml}
    </div>
  `;
}

function buildOtpContent({ otp, portalLabel, minutes }) {
  const subject = `GetMyPair ${portalLabel} verification code`;
  const text = [
    `Your GetMyPair ${portalLabel} login verification code is: ${otp}`,
    '',
    `This code expires in ${minutes} minute(s).`,
    'If you did not request this, ignore this email.',
  ].join('\n');
  const html = wrapHtml({
    title: `${portalLabel} login code`,
    bodyHtml: `
      <p style="margin:0 0 12px">Use this one-time code to finish signing in:</p>
      <p style="margin:0 0 16px;font-size:32px;letter-spacing:0.28em;font-weight:700;color:#102428">${otp}</p>
      <p style="margin:0;color:#5f7378;font-size:14px">Expires in ${minutes} minute(s). If you did not request this, ignore this email.</p>
    `,
  });
  return { subject, text, html };
}

function buildRegistrationReceivedContent({ name, storeName }) {
  const displayName = name || 'there';
  const storeLine = storeName ? ` for ${storeName}` : '';
  const subject = 'Thank you for registering with GetMyPair Darkworkstore';
  const text = [
    `Hi ${displayName},`,
    '',
    `Thank you for registering your Darkworkstore${storeLine}.`,
    'Our team will review your details and verify your account shortly.',
    'We will contact you once your store is approved. You cannot log in until verification is complete.',
    '',
    '— GetMyPair Darkworkstore team',
  ].join('\n');
  const html = wrapHtml({
    title: 'Thank you for registering',
    bodyHtml: `
      <p style="margin:0 0 12px">Hi ${displayName},</p>
      <p style="margin:0 0 12px">Thank you for registering your Darkworkstore${storeLine}.</p>
      <p style="margin:0 0 12px">Our team will review your details and <strong>verify your account shortly</strong>. We will email you login access once your store is approved.</p>
      <p style="margin:0;color:#5f7378;font-size:14px">You cannot sign in until verification is complete.</p>
    `,
  });
  return { subject, text, html };
}

function buildCredentialsContent({ name, storeName, email, password, loginUrl }) {
  const displayName = name || 'there';
  const storeLine = storeName ? ` (${storeName})` : '';
  const subject = 'Your Darkworkstore account is verified — login details';
  const text = [
    `Hi ${displayName},`,
    '',
    `Your Darkworkstore account${storeLine} has been verified.`,
    'You can now sign in with these details:',
    '',
    `Login link: ${loginUrl}`,
    `Email: ${email}`,
    `Temporary password: ${password}`,
    '',
    'After signing in you will receive a one-time email code to complete login.',
    'Please change this password after your first login if possible.',
    '',
    '— GetMyPair Darkworkstore team',
  ].join('\n');
  const html = wrapHtml({
    title: 'Your account is verified',
    bodyHtml: `
      <p style="margin:0 0 12px">Hi ${displayName},</p>
      <p style="margin:0 0 12px">Your Darkworkstore account${storeLine} has been verified. You can now sign in.</p>
      <p style="margin:0 0 8px"><strong>Login link:</strong> <a href="${loginUrl}" style="color:#0f5c63">${loginUrl}</a></p>
      <p style="margin:0 0 8px"><strong>Email:</strong> ${email}</p>
      <p style="margin:0 0 16px"><strong>Temporary password:</strong> <span style="font-size:18px;letter-spacing:0.04em;font-weight:700;color:#102428">${password}</span></p>
      <p style="margin:0;color:#5f7378;font-size:14px">You will receive a one-time email code after signing in. Keep this password private.</p>
    `,
  });
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

async function deliverEmail({ to, subject, text, html, logLabel }) {
  if (resendConfigured()) {
    try {
      const id = await sendViaResend({ to, subject, text, html });
      logger.info(`[email] ${logLabel} sent via Resend to ${to} id=${id}`);
      return { delivered: true, mode: 'resend' };
    } catch (err) {
      logger.error(`[email] Resend failed for ${to}: ${err.message}`);
    }
  }

  if (smtpConfigured()) {
    try {
      await sendViaSmtp({ to, subject, text, html });
      logger.info(`[email] ${logLabel} sent via SMTP to ${to}`);
      return { delivered: true, mode: 'smtp' };
    } catch (err) {
      logger.error(`[email] SMTP failed for ${to}: ${err.message}`);
    }
  }

  logger.info(`[email] No mail provider delivered — ${logLabel} for ${to}`);
  return { delivered: false, mode: 'log' };
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

module.exports = {
  resendConfigured,
  smtpConfigured,
  sendAdminLoginOtp,
  sendDarkworkstoreRegistrationReceived,
  sendDarkworkstoreCredentials,
};
