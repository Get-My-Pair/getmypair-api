/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : token.service.js
 * Description: JWT token service – generate/verify access & refresh, session management
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

const Session = require('../models/session.model');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require('../config/jwt');
const config = require('../config/env');
const logger = require('../utils/logger');

/**
 * Create session with tokens
 * @param {Object} user - User object
 * @param {String} deviceInfo - Device information
 * @param {String} ipAddress - IP address
 * @param {String} userAgent - User agent string
 * @returns {Object} Tokens and session
 */
const createSession = async (user, deviceInfo, ipAddress, userAgent) => {
  try {
    // Generate tokens - JWT contains userId, role, expiry for backend authorization
    const roleName = user.role?.name || (typeof user.role === 'string' ? user.role : null);
    const accessTokenPayload = {
      userId: user._id.toString(),
      role: roleName,
    };

    const refreshTokenPayload = {
      userId: user._id.toString(),
    };

    const accessToken = generateAccessToken(accessTokenPayload);
    const refreshToken = generateRefreshToken(refreshTokenPayload);

    // Session expiry: 7 days (matches refresh token lifetime)
    const sessionExpireDays = 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + sessionExpireDays);

    // Create session (tokens will be hashed by pre-save hook)
    const session = new Session({
      userId: user._id,
      accessToken,
      refreshToken,
      deviceInfo,
      ipAddress,
      userAgent,
      expiresAt,
    });

    await session.save();

    // expiresIn = access token TTL (5 min) for client to know when to refresh
    const accessTokenExpireSeconds = 5 * 60;
    return {
      accessToken,
      refreshToken,
      expiresIn: accessTokenExpireSeconds,
      session,
    };
  } catch (error) {
    logger.error(`Error creating session: ${error.message}`);
    throw error;
  }
};

/**
 * Refresh access token
 * @param {String} refreshToken - Refresh token
 * @returns {Object} New access token
 */
const refreshAccessToken = async (refreshToken) => {
  try {
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Find session by refresh token hash
    const session = await Session.findByRefreshToken(refreshToken);

    if (!session || !session.isActive) {
      throw new Error('Invalid or revoked refresh token');
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      session.isActive = false;
      await session.save();
      throw new Error('Session expired');
    }

    // Get user to generate new access token
    const User = require('../models/user.model');
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    // Generate new access token
    const roleName = user.role?.name || (typeof user.role === 'string' ? user.role : null);
    const accessTokenPayload = {
      userId: user._id.toString(),
      role: roleName,
    };

    const accessToken = generateAccessToken(accessTokenPayload);

    // Update session with new access token
    session.accessToken = accessToken;
    session.lastActivity = new Date();
    await session.save();

    return {
      accessToken,
      expiresIn: 5 * 60, // 5 min (access token TTL)
      userId: user._id.toString(),
    };
  } catch (error) {
    logger.error(`Error refreshing token: ${error.message}`);
    throw error;
  }
};

/**
 * Revoke session
 * @param {String} refreshToken - Refresh token to revoke
 * @returns {Boolean} Success status
 */
const revokeSession = async (refreshToken) => {
  try {
    const session = await Session.findByRefreshToken(refreshToken);

    if (session) {
      await session.revoke();
      return true;
    }

    return false;
  } catch (error) {
    logger.error(`Error revoking session: ${error.message}`);
    throw false;
  }
};

/**
 * Revoke all user sessions
 * @param {String} userId - User ID
 * @returns {Number} Number of sessions revoked
 */
const revokeAllUserSessions = async (userId) => {
  try {
    const result = await Session.updateMany(
      { userId, isActive: true },
      { $set: { isActive: false } }
    );

    return result.modifiedCount;
  } catch (error) {
    logger.error(`Error revoking all sessions: ${error.message}`);
    throw error;
  }
};

module.exports = {
  createSession,
  refreshAccessToken,
  revokeSession,
  revokeAllUserSessions,
};
