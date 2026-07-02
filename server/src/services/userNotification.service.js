/**
 * Persist and list in-app notifications for customer users.
 */
const mongoose = require('mongoose');
const UserNotification = require('../models/userNotification.model');

function paginate(page = 1, limit = 50) {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  return { page: p, limit: l, skip: (p - 1) * l };
}

async function createNotification({ userId, type, title, body, data }) {
  const uid = mongoose.Types.ObjectId.isValid(userId) ? userId : null;
  if (!uid) {
    throw new Error('Invalid userId for notification');
  }

  const serviceRequestId = data?.serviceRequestId
    ? String(data.serviceRequestId)
    : null;

  if (serviceRequestId && type === 'COST_APPROVAL_PENDING') {
    const existing = await UserNotification.findOne({
      userId: uid,
      type,
      'data.serviceRequestId': serviceRequestId,
      readAt: null,
    });
    if (existing) {
      existing.title = title;
      existing.body = body;
      existing.data = { ...existing.data, ...data, serviceRequestId };
      existing.markModified('data');
      await existing.save();
      return existing.toObject();
    }
  }

  const doc = await UserNotification.create({
    userId: uid,
    type,
    title,
    body,
    data: data || {},
  });
  return doc.toObject();
}

async function listForUser(userId, { page, limit, unreadOnly = false } = {}) {
  const { page: p, limit: l, skip } = paginate(page, limit);
  const filter = { userId };
  if (unreadOnly) {
    filter.readAt = null;
  }

  const [items, total, unreadCount] = await Promise.all([
    UserNotification.find(filter).sort({ updatedAt: -1, createdAt: -1 }).skip(skip).limit(l).lean(),
    UserNotification.countDocuments(filter),
    UserNotification.countDocuments({ userId, readAt: null }),
  ]);

  return {
    items,
    total,
    unreadCount,
    page: p,
    limit: l,
  };
}

async function markRead(notificationId, userId) {
  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    const err = new Error('Invalid notification id');
    err.statusCode = 400;
    throw err;
  }
  const doc = await UserNotification.findOneAndUpdate(
    { _id: notificationId, userId },
    { readAt: new Date() },
    { new: true }
  ).lean();
  if (!doc) {
    const err = new Error('Notification not found');
    err.statusCode = 404;
    throw err;
  }
  return doc;
}

async function markReadByServiceRequest(userId, serviceRequestId, type = 'COST_APPROVAL_PENDING') {
  if (!serviceRequestId) return null;
  return UserNotification.updateMany(
    {
      userId,
      type,
      'data.serviceRequestId': String(serviceRequestId),
      readAt: null,
    },
    { readAt: new Date() }
  );
}

module.exports = {
  createNotification,
  listForUser,
  markRead,
  markReadByServiceRequest,
};
