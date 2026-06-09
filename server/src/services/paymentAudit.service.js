const PaymentAudit = require('../models/paymentAudit.model');

async function logPaymentAudit(entry, req = null) {
  return PaymentAudit.log({
    ...entry,
    ipAddress: entry.ipAddress || req?.ip,
    userAgent: entry.userAgent || req?.get?.('user-agent'),
  });
}

module.exports = { logPaymentAudit };
