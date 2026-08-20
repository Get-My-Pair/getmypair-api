/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : adminMasterAuth.middleware.js
 * Description: JWT auth for master admin / Darkworkstore dashboards
 * ----------------------------------------------------------------------------
 */

const jwt = require('jsonwebtoken');
const config = require('../config/env');
const AdminMaster = require('../models/adminMaster.model');
const { unauthorized } = require('../utils/response');

const resolveRequiredPortal = (req) => {
  const path = String(req.baseUrl || req.originalUrl || '');
  if (path.includes('darkworkstore')) return 'darkworkstore';
  if (path.includes('/api/delivery')) return 'delivery';
  if (path.includes('masteradmin') || path.includes('sys-admin')) return 'masteradmin';
  return null;
};

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

    const requiredPortal = resolveRequiredPortal(req);
    const tokenPortal = decoded.portal || 'masteradmin';
    if (requiredPortal && tokenPortal !== requiredPortal) {
      return unauthorized(res, 'Invalid admin token');
    }

    const admin = await AdminMaster.findById(decoded.adminMasterId).lean();

    if (!admin || !admin.isActive) {
      return unauthorized(res, 'Admin not found or inactive');
    }

    const accountPortal = admin.portal || 'masteradmin';
    if (requiredPortal === 'masteradmin' && accountPortal !== 'masteradmin') {
      return unauthorized(res, 'Invalid admin token');
    }
    if (requiredPortal === 'darkworkstore') {
      if (accountPortal === 'darkworkstore') {
        if (!admin.isVerified || admin.status !== 'verified') {
          return unauthorized(res, 'Darkworkstore account is not verified');
        }
      } else if (accountPortal !== 'masteradmin') {
        return unauthorized(res, 'Invalid admin token');
      }
    }
    if (requiredPortal === 'delivery') {
      if (accountPortal !== 'delivery' || !admin.isVerified || admin.status !== 'verified') {
        return unauthorized(res, 'Delivery member account is not verified');
      }
    }

    req.adminMaster = {
      _id: admin._id,
      email: admin.email,
      name: admin.name,
      portal: accountPortal,
      storeName: admin.storeName || admin.name || '',
    };
    next();
  } catch (error) {
    return unauthorized(res, error.message || 'Invalid or expired token');
  }
};

module.exports = adminMasterAuth;
