/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : adminMaster.seed.js
 * Description: Ensures exactly one Masteradmin portal account on server start
 * ----------------------------------------------------------------------------
 */

const bcrypt = require('bcryptjs');
const AdminMaster = require('../models/adminMaster.model');
const config = require('../config/env');
const logger = require('../utils/logger');

const SALT_ROUNDS = 12;

/**
 * Ensure exactly one Masteradmin account exists.
 * Default (override with MASTER_ADMIN_EMAIL / MASTER_ADMIN_PASSWORD in .env):
 *   ranjith.c96me@gmail.com / 123455678
 *
 * Darkworkstore portal accounts are not removed.
 */
const ensureMasterAdmin = async () => {
  try {
    const email = (config.MASTER_ADMIN_EMAIL || 'ranjith.c96me@gmail.com').toLowerCase().trim();
    const plainPassword = config.MASTER_ADMIN_PASSWORD || '123455678';
    const passwordHash = await bcrypt.hash(plainPassword, SALT_ROUNDS);

    const backfill = await AdminMaster.updateMany(
      {
        email,
        $or: [{ portal: { $exists: false } }, { portal: null }, { portal: '' }],
      },
      {
        $set: {
          portal: 'masteradmin',
          isVerified: true,
          status: 'verified',
          isActive: true,
        },
      }
    );
    if (backfill.modifiedCount) {
      logger.info(`Backfilled portal=masteradmin on ${backfill.modifiedCount} row(s) for ${email}`);
    }

    const removed = await AdminMaster.deleteMany({
      portal: 'masteradmin',
      email: { $ne: email },
    });
    if (removed.deletedCount) {
      logger.info(`Removed ${removed.deletedCount} extra Masteradmin account(s)`);
    }

    const master = await AdminMaster.findOne({ email }).select('+passwordHash');
    if (master) {
      master.portal = 'masteradmin';
      master.name = master.name || 'Master Admin';
      master.isActive = true;
      master.isVerified = true;
      master.status = 'verified';
      master.registeredVia = 'masteradmin';
      master.passwordHash = passwordHash;
      await master.save();
      logger.info(`Masteradmin ready: ${email}`);
      return;
    }

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

    logger.info(`Masteradmin seeded: ${email}`);
  } catch (err) {
    logger.error(`Master admin seed failed: ${err.message}`);
    throw err;
  }
};

module.exports = { ensureMasterAdmin };
