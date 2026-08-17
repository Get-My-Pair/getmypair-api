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
 * Create master admin if none exists. Backfill portal on legacy rows.
 * Default credentials (override with MASTER_ADMIN_EMAIL / MASTER_ADMIN_PASSWORD in .env):
 *   ranjith.c96me@gmail.com / Admin@123
 */
const ensureMasterAdmin = async () => {
  try {
    const backfill = await AdminMaster.updateMany(
      {
        $or: [{ portal: { $exists: false } }, { portal: null }, { portal: '' }],
      },
      {
        $set: {
          portal: 'masteradmin',
          isVerified: true,
          status: 'verified',
        },
      }
    );
    if (backfill.modifiedCount) {
      logger.info(`Backfilled portal=masteradmin on ${backfill.modifiedCount} AdminMaster row(s)`);
    }

    const masterCount = await AdminMaster.countDocuments({ portal: 'masteradmin' });
    if (masterCount > 0) {
      logger.info('Master admin already exists; skipping seed');
      return;
    }

    const email = (config.MASTER_ADMIN_EMAIL || 'ranjith.c96me@gmail.com').toLowerCase().trim();
    const existing = await AdminMaster.findOne({ email });
    if (existing) {
      existing.portal = 'masteradmin';
      existing.isVerified = true;
      existing.status = 'verified';
      existing.isActive = true;
      await existing.save();
      logger.info(`Existing AdminMaster promoted to masteradmin: ${email}`);
      return;
    }

    const plainPassword = config.MASTER_ADMIN_PASSWORD || 'Admin@123';
    const passwordHash = await bcrypt.hash(plainPassword, SALT_ROUNDS);

    await AdminMaster.create({
      email,
      passwordHash,
      name: 'Master Admin',
      portal: 'masteradmin',
      isActive: true,
      isVerified: true,
      status: 'verified',
      registeredVia: 'masteradmin',
    });

    logger.info(`Master admin seeded: ${email} (change password after first login in production)`);
  } catch (err) {
    logger.error(`Master admin seed failed: ${err.message}`);
    throw err;
  }
};

module.exports = { ensureMasterAdmin };
