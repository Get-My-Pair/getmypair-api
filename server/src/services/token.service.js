const jwt = require('../config/jwt');
const Session = require('../models/session.model');
const config = require('../config/env');
const logger = require('../utils/logger');

const createSession = async (userId, refreshToken, deviceInfo = {}) => {
  try {
    const expiresAt = new Date(Date.now() + config.sessionExpiresIn);

    const session = await Session.create({
      userId,
      refreshToken,
      deviceInfo: {
        userAgent: deviceInfo.userAgent || '',
        ipAddress: deviceInfo.ipAddress || '',
        deviceType: deviceInfo.deviceType || 'unknown',
      },
      expiresAt,
    });

    return session;
  } catch (error) {
    logger.error('Error creating session:', error);
    throw error;
  }
};

const generateTokenPair = (user) => {
  const roleName = user.role?.name || user.role?._id || user.role;
  
  const payload = {
    userId: user._id,
    email: user.email,
    role: roleName,
  };

  const accessToken = jwt.generateAccessToken(payload);
  const refreshToken = jwt.generateRefreshToken({ userId: user._id });

  return { accessToken, refreshToken };
};

const refreshAccessToken = async (refreshToken) => {
  try {
    // Verify refresh token
    const decoded = jwt.verifyToken(refreshToken);

    // Check if session exists and is active
    const session = await Session.findOne({
      refreshToken,
      userId: decoded.userId,
      isActive: true,
      expiresAt: { $gt: new Date() },
    }).populate('userId');

    if (!session) {
      throw new Error('Invalid or expired refresh token');
    }

    // Get user to generate new tokens
    const User = require('../models/user.model');
    const user = await User.findById(decoded.userId).populate('role');

    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    // Generate new access token
    const roleName = user.role?.name || user.role?._id || user.role;
    
    const payload = {
      userId: user._id,
      email: user.email,
      role: roleName,
    };

    const accessToken = jwt.generateAccessToken(payload);

    // Update session last activity
    session.lastActivity = new Date();
    await session.save();

    return { accessToken };
  } catch (error) {
    logger.error('Error refreshing token:', error);
    throw error;
  }
};

const revokeSession = async (refreshToken) => {
  try {
    const session = await Session.findOneAndUpdate(
      { refreshToken },
      { isActive: false },
      { new: true }
    );

    return session;
  } catch (error) {
    logger.error('Error revoking session:', error);
    throw error;
  }
};

const revokeAllUserSessions = async (userId) => {
  try {
    const result = await Session.updateMany(
      { userId, isActive: true },
      { isActive: false }
    );

    return result;
  } catch (error) {
    logger.error('Error revoking all user sessions:', error);
    throw error;
  }
};

const cleanupExpiredSessions = async () => {
  try {
    const result = await Session.deleteMany({
      expiresAt: { $lt: new Date() },
    });
    logger.info(`Cleaned up ${result.deletedCount} expired sessions`);
    return result;
  } catch (error) {
    logger.error('Error cleaning up expired sessions:', error);
    throw error;
  }
};

module.exports = {
  createSession,
  generateTokenPair,
  refreshAccessToken,
  revokeSession,
  revokeAllUserSessions,
  cleanupExpiredSessions,
};
