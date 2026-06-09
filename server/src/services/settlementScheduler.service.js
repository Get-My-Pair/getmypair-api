/**
 * Automated settlement runner — invoked on server start and on interval.
 */
const config = require('../config/env');
const logger = require('../utils/logger');
const { runPendingSettlements } = require('./payment.service');

let intervalHandle = null;

function startSettlementScheduler() {
  if (!config.SETTLEMENT_SCHEDULER_ENABLED) {
    logger.info('Settlement scheduler disabled');
    return;
  }

  const intervalMs = config.SETTLEMENT_SCHEDULER_INTERVAL_MS || 60 * 60 * 1000;

  const tick = async () => {
    try {
      const result = await runPendingSettlements();
      if (result.processed > 0) {
        logger.info(`Settlement scheduler: processed ${result.processed} settlements`);
      }
    } catch (err) {
      logger.error(`Settlement scheduler error: ${err.message}`);
    }
  };

  tick();
  intervalHandle = setInterval(tick, intervalMs);
  logger.info(`Settlement scheduler started (every ${intervalMs}ms)`);
}

function stopSettlementScheduler() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}

module.exports = { startSettlementScheduler, stopSettlementScheduler };
