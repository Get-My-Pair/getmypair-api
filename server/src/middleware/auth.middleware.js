const jwt = require('../config/jwt');
const User = require('../models/user.model');
const { sendError } = require('../utils/response');
const logger = require('../utils/logger');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'No token provided', 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verifyToken(token);

    // Get user with role populated
    const user = await User.findById(decoded.userId)
      .populate('role')
      .select('-password');

    if (!user) {
      return sendError(res, 'User not found', 401);
    }

    if (!user.isActive) {
      return sendError(res, 'Account is deactivated', 401);
    }

    // Attach user to request
    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return sendError(res, 'Invalid or expired token', 401);
  }
};

module.exports = {
  authenticate,
};
