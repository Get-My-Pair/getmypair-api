/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : roles.js
 * Description: Role mapping – app source to role; seed roles (USER, COBBER, etc.)
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

/**
 * Application to Role Mapping
 * Role is assigned based on app source during registration.
 * Client CANNOT send or modify role - it is derived from app identifier.
 */

const APP_ROLES = {
  USER_APP: 'USER',
  COBBER_APP: 'COBBER',
  DELIVERY_APP: 'DELIVERY',
  ADMIN_APP: 'ADMIN',
};

const VALID_APP_SOURCES = Object.keys(APP_ROLES);
const VALID_ROLES = Object.values(APP_ROLES);

/**
 * Get role from app source
 * @param {String} appSource - App identifier (USER_APP, COBBER_APP, etc.)
 * @returns {String} Role name
 */
const getRoleFromAppSource = (appSource) => {
  const role = APP_ROLES[appSource];
  if (!role) {
    throw new Error(`Invalid app source. Must be one of: ${VALID_APP_SOURCES.join(', ')}`);
  }
  return role;
};

module.exports = {
  APP_ROLES,
  VALID_APP_SOURCES,
  VALID_ROLES,
  getRoleFromAppSource,
};
