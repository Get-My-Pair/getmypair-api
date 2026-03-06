/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : auth.middleware.js
 * Description: JWT auth middleware – verify access token, attach user to request
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

const { verifyAccessToken } = require('../config/jwt');
const User = require('../models/user.model');
const Session = require('../models/session.model');
const { unauthorized } = require('../utils/response');
const crypto = require('crypto');

/**
 * Authentication middleware
 * Verifies JWT access token and attaches user to request
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const AuditLog = require('../models/auditLog.model');
      await AuditLog.createLog({
        action: 'login',
        resource: 'auth',
        status: 'failure',
        errorMessage: 'No token provided',
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent') || 'unknown',
      });
      return unauthorized(res, 'No token provided');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      const AuditLog = require('../models/auditLog.model');
      await AuditLog.createLog({
        action: 'login',
        resource: 'auth',
        status: 'failure',
        errorMessage: 'No token provided',
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent') || 'unknown',
      });
      return unauthorized(res, 'No token provided');
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    // Find user
    const user = await User.findById(decoded.userId);

    if (!user) {
      const AuditLog = require('../models/auditLog.model');
      await AuditLog.createLog({
        action: 'login',
        resource: 'auth',
        status: 'failure',
        errorMessage: 'User not found',
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent') || 'unknown',
        details: { userId: decoded.userId },
      });
      return unauthorized(res, 'User not found');
    }

    // Check if user is active
    if (!user.isActive) {
      const AuditLog = require('../models/auditLog.model');
      await AuditLog.createLog({
        userId: user._id,
        action: 'login',
        resource: 'auth',
        status: 'failure',
        errorMessage: 'User account is inactive',
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent') || 'unknown',
      });
      return unauthorized(res, 'User account is inactive');
    }

    // Verify session exists and is active
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const session = await Session.findOne({
      userId: user._id,
      accessToken: tokenHash,
      isActive: true,
    });

    if (!session) {
      const AuditLog = require('../models/auditLog.model');
      await AuditLog.createLog({
        userId: user._id,
        action: 'login',
        resource: 'auth',
        status: 'failure',
        errorMessage: 'Invalid session',
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent') || 'unknown',
      });
      return unauthorized(res, 'Invalid session');
    }

    // Update last activity
    await session.updateActivity();

    // Attach user to request
    req.user = user;
    req.session = session;

    next();
  } catch (error) {
    const AuditLog = require('../models/auditLog.model');
    await AuditLog.createLog({
      action: 'login',
      resource: 'auth',
      status: 'failure',
      errorMessage: error.message || 'Invalid or expired token',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent') || 'unknown',
    });
    return unauthorized(res, error.message || 'Invalid or expired token');
  }
};

module.exports = authMiddleware;
