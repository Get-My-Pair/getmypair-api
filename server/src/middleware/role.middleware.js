const { forbidden } = require('../utils/response');

/**
 * Role-based authorization middleware
 * @param {Array<String>} allowedRoles - Array of allowed role names
 * @returns {Function} Middleware function
 */
const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return forbidden(res, 'Authentication required');
    }

    const userRole = req.user.role;

    if (!userRole) {
      return forbidden(res, 'User role not found');
    }

    if (!allowedRoles.includes(userRole)) {
      return forbidden(res, 'Insufficient permissions');
    }

    next();
  };
};

module.exports = roleMiddleware;