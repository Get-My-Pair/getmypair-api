/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : adminMasterAuth.middleware.js
 * Description: JWT auth for master admin dashboard (not mobile User/Session)
 * ----------------------------------------------------------------------------
 */

const jwt = require('jsonwebtoken');
const config = require('../config/env');
const AdminMaster = require('../models/adminMaster.model');
const { unauthorized } = require('../utils/response');

const adminMasterAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorized(res, 'No token provided');
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
      return unauthorized(res, 'No token provided');
    }

    const decoded = jwt.verify(token, config.JWT_SECRET);
    if (decoded.type !== 'admin_master' || !decoded.adminMasterId) {
      return unauthorized(res, 'Invalid admin token');
    }

    const admin = await AdminMaster.findById(decoded.adminMasterId).lean();

    if (!admin || !admin.isActive) {
      return unauthorized(res, 'Admin not found or inactive');
    }

    req.adminMaster = {
      _id: admin._id,
      email: admin.email,
      name: admin.name,
    };
    next();
  } catch (error) {
    return unauthorized(res, error.message || 'Invalid or expired token');
  }
};

module.exports = adminMasterAuth;
