const jwt = require('jsonwebtoken');
const config = require('../config/env');
const Recycler = require('../models/recycler.model');
const { unauthorized } = require('../utils/response');

/**
 * Recyclers get their own token type so a mobile-user token can never be used on
 * recycler routes (and vice versa). Signed with the same JWT_SECRET.
 */
const RECYCLER_TOKEN_TYPE = 'recycler';
const RECYCLER_TOKEN_EXPIRE = '7d';

function signRecyclerToken(recycler) {
  return jwt.sign(
    { sub: String(recycler._id), typ: RECYCLER_TOKEN_TYPE },
    config.JWT_SECRET,
    { expiresIn: RECYCLER_TOKEN_EXPIRE }
  );
}

/** Verifies a recycler Bearer token and attaches `req.recycler`. */
async function recyclerAuth(req, res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return unauthorized(res, 'No token provided');
  }

  let decoded;
  try {
    decoded = jwt.verify(header.slice(7), config.JWT_SECRET);
  } catch {
    return unauthorized(res, 'Session expired. Please sign in again.');
  }

  if (decoded.typ !== RECYCLER_TOKEN_TYPE || !decoded.sub) {
    return unauthorized(res, 'Invalid session. Please sign in again.');
  }

  try {
    const recycler = await Recycler.findById(decoded.sub);
    if (!recycler) return unauthorized(res, 'Account not found');
    if (!recycler.isActive) return unauthorized(res, 'This account is disabled.');
    req.recycler = recycler;
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  recyclerAuth,
  signRecyclerToken,
};
