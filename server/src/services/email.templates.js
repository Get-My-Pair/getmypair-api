/**
 * Branded HTML + plaintext for every transactional email GetMyPair sends.
 * Table layout and inline CSS so the UI holds in Gmail, Outlook, and Apple Mail.
 */
const config = require('../config/env');

const BRAND = {
  name: 'GetMyPair',
  ink: '#102428',
  muted: '#5f7378',
  teal: '#0f5c63',
  tealMid: '#137c84',
  accent: '#1fb5c1',
  canvas: '#e8eef0',
  paper: '#ffffff',
  footer: '#062f35',
  care: 'care@getmypair.com',
  address: '5137, Prestige Windsor Park, Poonamallee High Road, Vanagaram, Chennai - 600095',
};

function siteUrl() {
  return String(config.CLIENT_WEB_URL || 'https://getmypair.com').replace(/\/$/, '');
}

function assetBaseUrl() {
  return String(process.env.EMAIL_ASSET_BASE_URL || 'https://getmypair.com').replace(/\/$/, '');
}

function logoUrl() {
  return process.env.EMAIL_LOGO_URL || `${assetBaseUrl()}/assets/figma/logo-white.png`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function ctaButton(href, label) {
  const safeHref = escapeHtml(href);
  const safeLabel = escapeHtml(label);
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 4px">
      <tr>
        <td align="center" bgcolor="${BRAND.teal}" style="border-radius:10px;background:${BRAND.teal}">
          <a href="${safeHref}" target="_blank" rel="noopener noreferrer"
            style="display:inline-block;padding:14px 28px;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;line-height:1;color:#ffffff;text-decoration:none;border-radius:10px">
            ${safeLabel}
          </a>
        </td>
      </tr>
    </table>
  `;
}

function otpBox(otp) {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0 8px">
      <tr>
        <td align="center" style="background:#f4fbfb;border:1px dashed ${BRAND.tealMid};border-radius:12px;padding:22px 16px">
          <p style="margin:0 0 8px;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${BRAND.muted};font-weight:700">Verification code</p>
          <p style="margin:0;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:36px;letter-spacing:0.28em;font-weight:800;color:${BRAND.ink};line-height:1.2">${escapeHtml(otp)}</p>
        </td>
      </tr>
    </table>
  `;
}

function detailRows(rows) {
  const cells = rows
    .map(
      ([label, value], index) => `
        <tr>
          <td style="padding:${index === 0 ? '0' : '12px'} 0 0;border-top:${index === 0 ? '0' : '1px solid #e4ecee'}">
            <p style="margin:12px 0 0;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${BRAND.muted};font-weight:700">${escapeHtml(label)}</p>
            <p style="margin:4px 0 12px;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:16px;font-weight:700;color:${BRAND.ink};word-break:break-word">${value}</p>
          </td>
        </tr>
      `
    )
    .join('');
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 16px;background:#f7fbfb;border-radius:12px">
      <tr>
        <td style="padding:8px 20px 8px">${cells}</td>
      </tr>
    </table>
  `;
}

function nextSteps(items) {
  const rows = items
    .map(
      (item, index) => `
        <tr>
          <td valign="top" width="32" style="padding:0 10px 12px 0;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:13px;font-weight:800;color:${BRAND.teal}">${index + 1}.</td>
          <td valign="top" style="padding:0 0 12px;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:${BRAND.ink}">${item}</td>
        </tr>
      `
    )
    .join('');
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 4px">
      ${rows}
    </table>
  `;
}

function renderEmail({ preheader, kicker, title, bodyHtml }) {
  const year = new Date().getFullYear();
  const web = siteUrl();
  const safeTitle = escapeHtml(title);
  const safeKicker = escapeHtml(kicker);
  const safePreheader = escapeHtml(preheader || title);

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${safeTitle}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background:${BRAND.canvas};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all">${safePreheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.canvas}">
    <tr>
      <td align="center" style="padding:28px 12px">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;border-collapse:separate">
          <tr>
            <td style="background:${BRAND.teal};background:linear-gradient(135deg, ${BRAND.teal} 0%, ${BRAND.tealMid} 55%, ${BRAND.accent} 140%);padding:28px 32px;border-radius:16px 16px 0 0">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <img src="${escapeHtml(logoUrl())}" alt="${BRAND.name}" width="148" height="36" style="display:block;border:0;height:36px;width:auto;max-width:180px" />
                    <p style="margin:10px 0 0;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.78)">Your footwear companion</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:${BRAND.paper};padding:36px 36px 28px">
              <p style="margin:0 0 8px;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${BRAND.tealMid};font-weight:700">${safeKicker}</p>
              <h1 style="margin:0 0 18px;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:26px;line-height:1.25;color:${BRAND.ink};font-weight:800">${safeTitle}</h1>
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="background:${BRAND.footer};padding:28px 32px;border-radius:0 0 16px 16px">
              <p style="margin:0 0 10px;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:#ffffff">${BRAND.name}</p>
              <p style="margin:0 0 6px;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:12px;line-height:1.55;color:rgba(255,255,255,0.72)">${escapeHtml(BRAND.address)}</p>
              <p style="margin:0 0 16px;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:12px;color:rgba(255,255,255,0.72)">
                <a href="mailto:${BRAND.care}" style="color:#9ce9f2;text-decoration:none">${BRAND.care}</a>
              </p>
              <p style="margin:0 0 12px;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:12px">
                <a href="${escapeHtml(`${web}/privacy-policy`)}" style="color:#9ce9f2;text-decoration:none">Privacy Policy</a>
                <span style="color:rgba(255,255,255,0.35)"> &nbsp;|&nbsp; </span>
                <a href="${escapeHtml(`${web}/terms-and-conditions`)}" style="color:#9ce9f2;text-decoration:none">Terms &amp; Conditions</a>
              </p>
              <p style="margin:0;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:11px;color:rgba(255,255,255,0.48)">© ${year} ${BRAND.name}. This is an automated message — please do not reply.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function p(text, extra = '') {
  return `<p style="margin:0 0 14px;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:${BRAND.ink}${extra}">${text}</p>`;
}

function muted(text) {
  return `<p style="margin:16px 0 0;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:13px;line-height:1.55;color:${BRAND.muted}">${text}</p>`;
}

function buildOtpContent({ otp, portalLabel, minutes }) {
  const portal = portalLabel || 'portal';
  const mins = minutes || 5;
  const subject = `GetMyPair ${portal} verification code`;
  const text = [
    `Your GetMyPair ${portal} login verification code is: ${otp}`,
    '',
    `This code expires in ${mins} minute(s).`,
    'If you did not request this, ignore this email.',
    '',
    '— GetMyPair',
  ].join('\n');
  const html = renderEmail({
    preheader: `Your ${portal} login code is ${otp}. Expires in ${mins} minutes.`,
    kicker: `${portal} security`,
    title: 'Your one-time login code',
    bodyHtml: [
      p(`Use this code to finish signing in to <strong>${escapeHtml(portal)}</strong>.`),
      otpBox(otp),
      muted(`Expires in ${escapeHtml(mins)} minute(s). If you did not request this, you can ignore this email.`),
    ].join(''),
  });
  return { subject, text, html };
}

function buildRegistrationReceivedContent({ name, storeName }) {
  const displayName = name || 'there';
  const store = storeName || 'your Dark Work Store';
  const subject = 'Thank you for registering with GetMyPair Dark Work Store';
  const text = [
    `Hi ${displayName},`,
    '',
    `Thank you for registering ${store} with GetMyPair.`,
    'Our team will review your details and verify your account shortly.',
    'We will email you login access once your store is approved. You cannot sign in until verification is complete.',
    '',
    '— GetMyPair Dark Work Store team',
  ].join('\n');
  const html = renderEmail({
    preheader: `Thanks for registering ${store}. We will verify your account shortly.`,
    kicker: 'Dark Work Store',
    title: 'Thank you for registering',
    bodyHtml: [
      p(`Hi ${escapeHtml(displayName)},`),
      p(
        `Thank you for registering <strong>${escapeHtml(store)}</strong>. Your application is with our team.`
      ),
      p('What happens next:'),
      nextSteps([
        'We review your store details and contact information.',
        'Once approved, you receive a login email with a temporary password.',
        'Sign in, enter the one-time email code, and start managing jobs.',
      ]),
      muted('You cannot sign in until verification is complete. No action is needed from you right now.'),
    ].join(''),
  });
  return { subject, text, html };
}

function buildCredentialsContent({
  name,
  storeName,
  email,
  password,
  loginUrl,
  portalLabel = 'Dark Work Store',
  ctaLabel = 'Sign in to Dark Work Store',
  title = 'Your store is ready to sign in',
  intro,
}) {
  const displayName = name || 'there';
  const store = storeName || `your ${portalLabel}`;
  const subject = `Your ${portalLabel} account is verified — login details`;
  const bodyIntro =
    intro ||
    `<strong>${escapeHtml(store)}</strong> has been verified. Use the details below to open the ${escapeHtml(portalLabel)} dashboard.`;
  const text = [
    `Hi ${displayName},`,
    '',
    `Your ${portalLabel} account (${store}) is ready.`,
    'You can now sign in with these details:',
    '',
    `Login link: ${loginUrl}`,
    `Email: ${email}`,
    `Temporary password: ${password}`,
    '',
    'After signing in you will receive a one-time email code to complete login.',
    'Please change this password after your first login if possible.',
    '',
    `— GetMyPair ${portalLabel} team`,
  ].join('\n');
  const html = renderEmail({
    preheader: `${store} is ready. Your login details are inside.`,
    kicker: 'Account ready',
    title,
    bodyHtml: [
      p(`Hi ${escapeHtml(displayName)},`),
      p(bodyIntro),
      detailRows([
        ['Login email', escapeHtml(email)],
        [
          'Temporary password',
          `<span style="font-size:18px;letter-spacing:0.04em">${escapeHtml(password)}</span>`,
        ],
      ]),
      ctaButton(loginUrl, ctaLabel),
      muted(
        'After you enter your password you will receive a one-time email code. Keep this password private and change it after your first login.'
      ),
    ].join(''),
  });
  return { subject, text, html };
}

function buildDeliveryMemberCredentials({ name, email, password, loginUrl }) {
  return buildCredentialsContent({
    name,
    storeName: name || 'Delivery member',
    email,
    password,
    loginUrl,
    portalLabel: 'Delivery member',
    ctaLabel: 'Open delivery dashboard',
    title: 'Your delivery dashboard is ready',
    intro: 'Your GetMyPair delivery member account is ready. Use the details below to sign in and view assigned pickup jobs.',
  });
}

function listEmailTemplates() {
  const loginUrl = `${siteUrl()}/darkworkstore/login`;
  const minutes = config.OTP_EXPIRE_MINUTES || 5;
  return [
    {
      id: 'portal-otp-masteradmin',
      name: 'Master Console login OTP',
      trigger: 'Masteradmin password login — step 2',
      audience: 'Masteradmin',
      ...buildOtpContent({ otp: '482917', portalLabel: 'Master Console', minutes }),
    },
    {
      id: 'portal-otp-darkworkstore',
      name: 'Dark Work Store login OTP',
      trigger: 'Dark Work Store password login — step 2',
      audience: 'Dark Work Store',
      ...buildOtpContent({ otp: '482917', portalLabel: 'Dark Work Store', minutes }),
    },
    {
      id: 'darkworkstore-registration',
      name: 'Store registration received',
      trigger: 'Public Dark Work Store signup',
      audience: 'Dark Work Store applicant',
      ...buildRegistrationReceivedContent({
        name: 'Priya Sharma',
        storeName: 'Vanagaram Workshop',
      }),
    },
    {
      id: 'darkworkstore-credentials',
      name: 'Store verified — login details',
      trigger: 'Masteradmin verifies a Dark Work Store account',
      audience: 'Verified store owner',
      ...buildCredentialsContent({
        name: 'Priya Sharma',
        storeName: 'Vanagaram Workshop',
        email: 'store@example.com',
        password: 'Tp7!kLm9Qx2A',
        loginUrl,
      }),
    },
    {
      id: 'delivery-member-credentials',
      name: 'Delivery member — login details',
      trigger: 'Masteradmin clicks Send email on a delivery member',
      audience: 'Delivery member',
      ...buildDeliveryMemberCredentials({
        name: 'Arun Kumar',
        email: 'rider@example.com',
        password: 'Rk4!nPq8Wx1C',
        loginUrl: `${siteUrl()}/delivery/login`,
      }),
    },
  ];
}

module.exports = {
  buildOtpContent,
  buildRegistrationReceivedContent,
  buildCredentialsContent,
  buildDeliveryMemberCredentials,
  listEmailTemplates,
};
