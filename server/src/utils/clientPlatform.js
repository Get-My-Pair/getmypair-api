/**
 * Resolve client platform for OTP delivery mode.
 * Prefer explicit `X-Client-Platform` from the app; fall back to User-Agent.
 *
 * - web  → Dev OTP (return code in API response, skip MSG91)
 * - android / ios / mobile → production SMS via MSG91 (never echo OTP)
 */
function resolveClientPlatform(req) {
  const header = String(
    req.get('x-client-platform') ||
      req.get('X-Client-Platform') ||
      req.headers['x-client-platform'] ||
      ''
  )
    .trim()
    .toLowerCase();

  if (header === 'web' || header === 'android' || header === 'ios' || header === 'mobile') {
    return header === 'mobile' ? 'android' : header;
  }

  const ua = String(req.get('user-agent') || '').toLowerCase();
  if (
    ua.includes('mozilla/') ||
    ua.includes('chrome/') ||
    ua.includes('safari/') ||
    ua.includes('firefox/') ||
    ua.includes('edg/')
  ) {
    // Flutter web uses a normal browser UA.
    return 'web';
  }
  if (ua.includes('android') || ua.includes('okhttp') || ua.includes('dart')) {
    return 'android';
  }
  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ios')) {
    return 'ios';
  }

  // Safe default: production SMS (never leak OTP).
  return 'android';
}

function isWebClient(platform) {
  return String(platform || '').toLowerCase() === 'web';
}

module.exports = {
  resolveClientPlatform,
  isWebClient,
};
