/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : fixUserRoleReference.js
 * Description: Some legacy users have role stored as a string (e.g. "user")
 *              instead of Role ObjectId — breaks .populate('role').
 * ----------------------------------------------------------------------------
 */

const mongoose = require('mongoose');
const Role = require('../models/role.model');

/**
 * If user.role is not a valid ObjectId, treat it as a role name and replace with Role._id.
 * Persists the fix. No-op if already valid ObjectId or null.
 * @param {import('mongoose').Document} user - Mongoose User document (not lean)
 * @returns {Promise<import('mongoose').Document>}
 */
async function fixLegacyStringRoleOnUser(user) {
  if (!user || user.role == null) {
    return user;
  }
  if (mongoose.isValidObjectId(user.role)) {
    return user;
  }

  await Role.initializeDefaultRoles();
  const roleName = String(user.role).trim().toUpperCase();
  const r = await Role.findOne({ name: roleName }) || (await Role.findOne({ name: 'USER' }));

  if (!r) {
    return user;
  }

  user.role = r._id;
  await user.save();
  return user;
}

module.exports = {
  fixLegacyStringRoleOnUser,
};
