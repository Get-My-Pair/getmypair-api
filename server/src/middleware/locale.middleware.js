const { resolveLanguage } = require('../utils/i18n');

/**
 * Attach resolved locale to each request for localized responses.
 */
const localeMiddleware = (req, res, next) => {
  req.locale = resolveLanguage(req);
  next();
};

module.exports = localeMiddleware;
