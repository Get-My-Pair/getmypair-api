/**
 * Payment notification triggers (push/email/SMS hooks).
 * Integrate FCM/SMTP here; currently logs for audit trail.
 */
const logger = require('../utils/logger');

async function notifyPaymentEvent({ userId, type, title, body, data }) {
  logger.info(`[PaymentNotification] user=${userId} type=${type} title=${title}`);
  return { queued: true, type, title, body, data: data || {} };
}

async function notifyCostApprovalPending({ userId, serviceRequestId, actualCost }) {
  return notifyPaymentEvent({
    userId,
    type: 'COST_APPROVAL_PENDING',
    title: 'Service cost approval required',
    body: `Please review the final cost of ₹${actualCost} for your service request.`,
    data: { serviceRequestId, actualCost },
  });
}

async function notifyPaymentSuccess({ userId, serviceRequestId, amount }) {
  return notifyPaymentEvent({
    userId,
    type: 'PAYMENT_SUCCESS',
    title: 'Payment received',
    body: `Your payment of ₹${amount} was successful. Pickup will be scheduled shortly.`,
    data: { serviceRequestId, amount },
  });
}

async function notifyPaymentFailed({ userId, serviceRequestId, reason }) {
  return notifyPaymentEvent({
    userId,
    type: 'PAYMENT_FAILED',
    title: 'Payment failed',
    body: reason || 'Your payment could not be processed. Please try again.',
    data: { serviceRequestId },
  });
}

module.exports = {
  notifyPaymentEvent,
  notifyCostApprovalPending,
  notifyPaymentSuccess,
  notifyPaymentFailed,
};
