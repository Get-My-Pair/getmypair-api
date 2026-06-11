/**
 * In-app notifications for customer users (cost approval, payments, etc.).
 */
const mongoose = require('mongoose');

const userNotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    readAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

userNotificationSchema.index({ userId: 1, createdAt: -1 });
userNotificationSchema.index({ userId: 1, type: 1, 'data.serviceRequestId': 1 });

const UserNotification = mongoose.model('UserNotification', userNotificationSchema);
module.exports = UserNotification;
