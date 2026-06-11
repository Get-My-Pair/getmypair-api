/**
 * Customer in-app notifications.
 */
const userNotificationService = require('../services/userNotification.service');
const { success, error: errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * GET /api/user/notifications
 * Query: page?, limit?, unreadOnly?
 */
const listNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page, limit, unreadOnly } = req.query;
    const data = await userNotificationService.listForUser(userId, {
      page,
      limit,
      unreadOnly: unreadOnly === 'true' || unreadOnly === '1',
    });
    return success(res, 'Notifications retrieved', data);
  } catch (err) {
    logger.error(`List notifications error: ${err.message}`);
    return errorResponse(res, err.message, err.statusCode || 500);
  }
};

/**
 * PATCH /api/user/notifications/:id/read
 */
const markNotificationRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const notification = await userNotificationService.markRead(id, userId);
    return success(res, 'Notification marked as read', { notification });
  } catch (err) {
    logger.error(`Mark notification read error: ${err.message}`);
    return errorResponse(res, err.message, err.statusCode || 500);
  }
};

module.exports = {
  listNotifications,
  markNotificationRead,
};
