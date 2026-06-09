/**
 * Payment & service routing workflow constants (GetMyPair spec).
 */

const workflowStatuses = [
  'CREATED',
  'AWAITING_ACCEPTANCE',
  'DARKWORKSTORE_REJECTED',
  'COBBLER_PENDING',
  'COBBLER_REJECTED',
  'COBBLER_COST_PENDING',
  'COST_APPROVAL_PENDING',
  'PAYMENT_PENDING',
  'PAYMENT_SUCCESS',
  'PICKUP_SCHEDULED',
  'IN_PROGRESS',
  'WORK_COMPLETED',
  'DELIVERY_SCHEDULED',
  'DELIVERED',
  'CLOSED',
  'ESCALATED_TO_GMP',
];

const paymentStates = [
  'PAYMENT_PENDING',
  'COST_APPROVAL_PENDING',
  'PAYMENT_INITIATED',
  'PAYMENT_SUCCESS',
  'PAYMENT_FAILED',
  'PAYMENT_REFUNDED',
];

const paymentTransactionStatuses = [
  'PAYMENT_PENDING',
  'PAYMENT_INITIATED',
  'PAYMENT_SUCCESS',
  'PAYMENT_FAILED',
  'PAYMENT_REFUNDED',
];

const providerTypes = ['dark_store', 'cobbler', 'gmp'];

/** Cobbler direct-route revenue split (spec: 80% cobbler / 20% GMP). */
const COBBLER_SHARE_PERCENT = 80;
const GMP_COMMISSION_PERCENT = 20;

const settlementStatuses = ['pending', 'processing', 'completed', 'failed'];

const refundStatuses = ['requested', 'processing', 'completed', 'failed'];

module.exports = {
  workflowStatuses,
  paymentStates,
  paymentTransactionStatuses,
  providerTypes,
  COBBLER_SHARE_PERCENT,
  GMP_COMMISSION_PERCENT,
  settlementStatuses,
  refundStatuses,
};
