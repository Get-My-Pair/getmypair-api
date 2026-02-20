const { forbidden } = require('../utils/response');
const { VALID_ROLES } = require('../config/roles');

/**
 * Role-based authorization middleware
 * Validates JWT, extracts role, checks if role is allowed for the API
 * @param {Array<String>} allowedRoles - Allowed roles (USER, COBBER, DELIVERY, ADMIN)
 * @returns {Function} Middleware function
 */
const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return forbidden(res, 'Authentication required');
    }

<<<<<<< HEAD
    const userRole = req.user.role?.name || req.user.role;
    const roleUpper = typeof userRole === 'string' ? userRole.toUpperCase() : userRole;
=======
    const userRole = req.user.role;
>>>>>>> 87393ab8441ae77f9658bd8e2f32b2026e3272ac

    if (!roleUpper || !VALID_ROLES.includes(roleUpper)) {
      return forbidden(res, 'User role not found');
    }

    if (!allowedRoles.map((r) => r.toUpperCase()).includes(roleUpper)) {
      return forbidden(res, 'Access denied. Insufficient permissions.');
    }

    next();
  };
};

module.exports = roleMiddleware;