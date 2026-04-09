/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : adminMaster.seed.js
 * Description: Ensures exactly one master admin exists (seed on server start)
 * ----------------------------------------------------------------------------
 */

const bcrypt = require('bcryptjs');
const AdminMaster = require('../models/adminMaster.model');
const config = require('../config/env');
const logger = require('../utils/logger');

const SALT_ROUNDS = 12;

/**
 * Create master admin if collection is empty.
 * Default credentials (override with MASTER_ADMIN_EMAIL / MASTER_ADMIN_PASSWORD in .env):
 *   ranjith.c96me@gmail.com / Admin@123
 */
const ensureMasterAdmin = async () => {
  try {
    const count = await AdminMaster.countDocuments();
    if (count > 0) {
      logger.info('Master admin already exists; skipping seed');
      return;
    }

    const email = (config.MASTER_ADMIN_EMAIL || 'ranjith.c96me@gmail.com').toLowerCase().trim();
    const plainPassword = config.MASTER_ADMIN_PASSWORD || 'Admin@123';
    const passwordHash = await bcrypt.hash(plainPassword, SALT_ROUNDS);

    await AdminMaster.create({
      email,
      passwordHash,
      name: 'Darkworkstore',
      isActive: true,
    });

    logger.info(`Master admin seeded: ${email} (change password after first login in production)`);
  } catch (err) {
    logger.error(`Master admin seed failed: ${err.message}`);
    throw err;
  }
};

module.exports = { ensureMasterAdmin };
