/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : role.middleware.js
 * Description: Role-based auth – restrict routes by USER, COBBER, DELIVERY, ADMIN
 * ----------------------------------------------------------------------------
 * Developer  : C Ranjith Kumar
 * LinkedIn         : https://www.linkedin.com/in/coding-ranjith/
 * Personal GitHub  : https://github.com/CodingRanjith
 * Project GitHub   : https://github.com/Ranjithgmp
 * Personal Email   : ranjith.c96me@gmail.com
 * Project Email    : ranjith.kumar@getmypair.com
 * ----------------------------------------------------------------------------
 * Last modified : 2025-03-03
 * ----------------------------------------------------------------------------
 */

const { forbidden } = require('../utils/response');
const { VALID_ROLES, getRoleFromAppSource } = require('../config/roles');
const Role = require('../models/role.model');

/**
 * Role-based authorization middleware
 * Validates JWT, extracts role, checks if role is allowed for the API.
 * If user's DB role is not allowed, allows access when X-App-Source maps to an allowed role
 * (e.g. USER_APP -> USER so user app profile works even if user has COBBER role from cobbler app).
 * @param {Array<String>} allowedRoles - Allowed roles (USER, COBBER, DELIVERY, ADMIN)
 * @returns {Function} Middleware function
 */
const roleMiddleware = (allowedRoles) => {
  return async (req, res, next) => {
    if (!req.user) {
      return forbidden(res, 'Authentication required');
    }

    let userRole = req.user.role?.name || req.user.role;

    // If role is ObjectId (not populated), fetch Role document to get name
    if (userRole != null && typeof userRole !== 'string') {
      const roleId = userRole._id || userRole;
      const roleDoc = await Role.findById(roleId).lean();
      userRole = roleDoc ? roleDoc.name : null;
    }

    const roleUpper = typeof userRole === 'string' ? userRole.toUpperCase() : (userRole || '');
    const allowedUpper = allowedRoles.map((r) => r.toUpperCase());

    // Helper: allow if X-App-Source maps to an allowed role (case-insensitive header)
    const allowByAppSource = () => {
      try {
        const raw = req.get('X-App-Source');
        const appSource = (raw && typeof raw === 'string' ? raw.trim() : '').toUpperCase();
        if (!appSource) return false;
        const roleFromApp = getRoleFromAppSource(appSource);
        return roleFromApp && allowedUpper.includes(roleFromApp.toUpperCase());
      } catch (_) {
        return false;
      }
    };

    if (!roleUpper || !VALID_ROLES.includes(roleUpper)) {
      if (allowByAppSource()) return next();
      return forbidden(res, 'User role not found');
    }

    if (allowedUpper.includes(roleUpper)) {
      return next();
    }

    if (allowByAppSource()) {
      return next();
    }

    return forbidden(res, 'Access denied. Insufficient permissions.');
  };
};

module.exports = roleMiddleware;