/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : session.controller.js
 * Description: Session management – list and revoke user active sessions
 * ----------------------------------------------------------------------------
 */

const Session = require('../models/session.model');
const AuditLog = require('../models/auditLog.model');
const { success, error: errorResponse, notFound } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * GET /api/auth/sessions
 * Returns active sessions for the authenticated user.
 */
const listUserSessions = async (req, res) => {
  try {
    const userId = req.user._id;
    const currentSessionId = req.session?._id?.toString() ?? null;

    const sessions = await Session.find({ userId, isActive: true })
      .sort({ lastActivity: -1 })
      .select('_id deviceInfo ipAddress userAgent lastActivity expiresAt')
      .lean();

    return success(res, 'Sessions retrieved successfully', {
      currentSessionId,
      sessions: sessions.map((s) => ({
        id: s._id.toString(),
        deviceInfo: s.deviceInfo || 'This device',
        ipAddress: s.ipAddress,
        userAgent: s.userAgent,
        lastActivity: s.lastActivity,
        expiresAt: s.expiresAt,
      })),
    });
  } catch (err) {
    logger.error(`List sessions error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

/**
 * DELETE /api/auth/sessions/:sessionId
 * Revokes an active session.
 */
const revokeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;

    const session = await Session.findOne({
      _id: sessionId,
      userId,
      isActive: true,
    });

    if (!session) {
      return notFound(res, 'Session not found');
    }

    await session.revoke();

    // Audit log (use existing enums: action=logout, resource=session)
    await AuditLog.createLog({
      userId: req.user._id,
      action: 'logout',
      resource: 'session',
      status: 'success',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent') || 'unknown',
      details: {
        revokedSessionId: sessionId,
        deviceInfo: session.deviceInfo,
      },
    });

    return success(res, 'Session revoked successfully');
  } catch (err) {
    logger.error(`Revoke session error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

module.exports = {
  listUserSessions,
  revokeSession,
};

