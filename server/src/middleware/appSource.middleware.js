/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : appSource.middleware.js
 * Description: Require X-App / X-App-Source on complete-profile
 * ----------------------------------------------------------------------------
 */

const { VALID_APP_SOURCES } = require('../config/roles');
const { error } = require('../utils/response');

const getAppSourceHeader = (req) => {
  const raw = req.get('X-App-Source') || req.get('X-App') || '';
  return String(raw).trim();
};

/**
 * Complete Profile requires an application identifier.
 * Accepts X-App-Source (canonical) or X-App (alias used by QA / some clients).
 */
const requireAppSource = (req, res, next) => {
  const appSource = getAppSourceHeader(req);

  if (!appSource) {
    return error(res, 'The required X-App header is missing', 400);
  }

  const normalized = appSource.toUpperCase();
  if (!VALID_APP_SOURCES.includes(normalized)) {
    return error(res, 'Invalid application identifier', 400);
  }

  req.appSource = normalized;
  next();
};

module.exports = {
  requireAppSource,
  getAppSourceHeader,
};
