const { verifyAccessToken } = require('../config/jwt');
const User = require('../models/user.model');
const Session = require('../models/session.model');
const { unauthorized } = require('../utils/response');
const crypto = require('crypto');

/**
 * Authentication middleware
 * Verifies JWT access token and attaches user to request
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorized(res, 'No token provided');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return unauthorized(res, 'No token provided');
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    // Find user
    const user = await User.findById(decoded.userId)
      .select('-password')
      .populate('role');

    if (!user) {
      return unauthorized(res, 'User not found');
    }

    // Check if user is active
    if (!user.isActive) {
      return unauthorized(res, 'User account is inactive');
    }

    // Verify session exists and is active
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const session = await Session.findOne({
      userId: user._id,
      accessToken: tokenHash,
      isActive: true,
    });

    if (!session) {
      return unauthorized(res, 'Invalid session');
    }

    // Update last activity
    await session.updateActivity();

    // Attach user to request
    req.user = user;
    req.session = session;

    next();
  } catch (error) {
    return unauthorized(res, error.message || 'Invalid or expired token');
  }
};

module.exports = authMiddleware;
