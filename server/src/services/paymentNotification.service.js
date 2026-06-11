/**
 * Payment notification triggers (push/email/SMS hooks + in-app notifications).
 */
const logger = require('../utils/logger');
const userNotificationService = require('./userNotification.service');

async function notifyPaymentEvent({ userId, type, title, body, data }) {
  logger.info(`[PaymentNotification] user=${userId} type=${type} title=${title}`);

  try {
    await userNotificationService.createNotification({
      userId,
      type,
      title,
      body,
      data: data || {},
    });
  } catch (err) {
    logger.error(`[PaymentNotification] failed to persist in-app notification: ${err.message}`);
  }

  return { queued: true, type, title, body, data: data || {} };
}

async function notifyCostApprovalPending({ userId, serviceRequestId, actualCost }) {
  return notifyPaymentEvent({
    userId,
    type: 'COST_APPROVAL_PENDING',
    title: 'Service cost approval required',
    body: `Please review the final cost of ₹${actualCost} for your service request.`,
    data: { serviceRequestId: String(serviceRequestId), actualCost },
  });
}

async function notifyDarkstoreCostUpdated({ userId, serviceRequestId, actualCost }) {
  return notifyPaymentEvent({
    userId,
    type: 'COST_APPROVAL_PENDING',
    title: 'Final service cost updated',
    body: `Darkworkstore updated the final service cost to ₹${actualCost}. Please review and approve to continue.`,
    data: { serviceRequestId: String(serviceRequestId), actualCost, source: 'darkstore' },
  });
}

async function notifyPaymentSuccess({ userId, serviceRequestId, amount }) {
  return notifyPaymentEvent({
    userId,
    type: 'PAYMENT_SUCCESS',
    title: 'Payment received',
    body: `Your payment of ₹${amount} was successful. Pickup will be scheduled shortly.`,
    data: { serviceRequestId: String(serviceRequestId), amount },
  });
}

async function notifyPaymentFailed({ userId, serviceRequestId, reason }) {
  return notifyPaymentEvent({
    userId,
    type: 'PAYMENT_FAILED',
    title: 'Payment failed',
    body: reason || 'Your payment could not be processed. Please try again.',
    data: { serviceRequestId: String(serviceRequestId) },
  });
}

module.exports = {
  notifyPaymentEvent,
  notifyCostApprovalPending,
  notifyDarkstoreCostUpdated,
  notifyPaymentSuccess,
  notifyPaymentFailed,
};
