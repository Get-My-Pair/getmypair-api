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
const { VALID_ROLES } = require('../config/roles');
const Role = require('../models/role.model');

/**
 * Role-based authorization middleware
 * Validates JWT, extracts role, checks if role is allowed for the API
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