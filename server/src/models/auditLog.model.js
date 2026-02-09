const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'register',
        'login',
        'logout',
        'password-reset',
        'otp-generate',
        'otp-verify',
        'token-refresh',
        'account-lockout',
        'permission-denied',
        'profile-update',
      ],
      index: true,
    },
    resource: {
      type: String,
      required: true,
      enum: ['user', 'auth', 'session', 'otp'],
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['success', 'failure'],
      index: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    errorMessage: {
      type: String,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ status: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 }); // For cleanup queries

// TTL index to auto-delete logs after 90 days
auditLogSchema.index(
  { timestamp: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 }
);

// Static method to create audit log
auditLogSchema.statics.createLog = async function (logData) {
  return this.create({
    userId: logData.userId || null,
    action: logData.action,
    resource: logData.resource,
    ipAddress: logData.ipAddress,
    userAgent: logData.userAgent,
    status: logData.status,
    details: logData.details || {},
    errorMessage: logData.errorMessage,
    timestamp: logData.timestamp || Date.now(),
  });
};

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
