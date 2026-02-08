const { sendError } = require('../utils/response');

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    if (!req.user.role) {
      return sendError(res, 'User role not found', 403);
    }

    const userRole = req.user.role.name || req.user.role;

    if (!allowedRoles.includes(userRole)) {
      return sendError(res, 'Insufficient permissions', 403);
    }

    next();
  };
};

const hasPermission = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    if (!req.user.role) {
      return sendError(res, 'User role not found', 403);
    }

    const userPermissions = req.user.role.permissions || [];

    const hasAllPermissions = requiredPermissions.every((permission) =>
      userPermissions.includes(permission)
    );

    if (!hasAllPermissions) {
      return sendError(res, 'Insufficient permissions', 403);
    }

    next();
  };
};

module.exports = {
  authorize,
  hasPermission,
};
