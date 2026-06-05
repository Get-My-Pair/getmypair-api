/**
 * GMP commission engine — 80/20 split for cobbler-direct routes; 100% to dark store/GMP ops otherwise.
 */
const {
  COBBLER_SHARE_PERCENT,
  GMP_COMMISSION_PERCENT,
} = require('../constants/paymentWorkflow.constants');

/**
 * @param {number} totalAmount - payable amount in INR (whole rupees)
 * @param {'cobbler'|'dark_store'|'gmp'} providerType
 * @returns {{ totalAmount, gmpShare, cobblerShare, partnerShare, commissionPercent }}
 */
function calculateRevenueSplit(totalAmount, providerType = 'cobbler') {
  const amount = Math.max(0, Number(totalAmount) || 0);
  if (providerType === 'cobbler') {
    const cobblerShare = Math.round((amount * COBBLER_SHARE_PERCENT) / 100);
    const gmpShare = amount - cobblerShare;
    return {
      totalAmount: amount,
      gmpShare,
      cobblerShare,
      partnerShare: cobblerShare,
      commissionPercent: GMP_COMMISSION_PERCENT,
    };
  }
  return {
    totalAmount: amount,
    gmpShare: providerType === 'gmp' ? amount : 0,
    cobblerShare: 0,
    partnerShare: providerType === 'dark_store' ? amount : 0,
    commissionPercent: providerType === 'gmp' ? 100 : 0,
  };
}

module.exports = { calculateRevenueSplit, COBBLER_SHARE_PERCENT, GMP_COMMISSION_PERCENT };
