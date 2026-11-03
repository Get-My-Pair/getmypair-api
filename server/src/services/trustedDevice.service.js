const TrustedDevice = require('../models/trustedDevice.model');
const logger = require('../utils/logger');

/** Keep device trust for 180 days after last successful use. */
const TRUST_TTL_MS = 180 * 24 * 60 * 60 * 1000;

async function issueTrustedDevice({ userId, mobile, deviceId, deviceInfo }) {
  if (!userId || !mobile || !deviceId) return null;

  const deviceAuthToken = TrustedDevice.generateToken();
  const tokenHash = TrustedDevice.hashToken(deviceAuthToken);
  const expiresAt = new Date(Date.now() + TRUST_TTL_MS);

  await TrustedDevice.findOneAndUpdate(
    { mobile, deviceId },
    {
      $set: {
        userId,
        mobile,
        deviceId,
        tokenHash,
        deviceInfo: deviceInfo || '',
        lastUsedAt: new Date(),
        expiresAt,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  logger.info(`Trusted device issued mobile=${mobile} deviceId=${deviceId.slice(0, 8)}…`);
  return { deviceAuthToken, expiresAt };
}

async function findValidTrustedDevice({ mobile, deviceId, deviceAuthToken }) {
  if (!mobile || !deviceId || !deviceAuthToken) return null;

  const tokenHash = TrustedDevice.hashToken(deviceAuthToken);
  const doc = await TrustedDevice.findOne({
    mobile,
    deviceId,
    tokenHash,
    expiresAt: { $gt: new Date() },
  });

  return doc;
}

async function touchTrustedDevice(doc) {
  if (!doc) return;
  doc.lastUsedAt = new Date();
  doc.expiresAt = new Date(Date.now() + TRUST_TTL_MS);
  await doc.save();
}

async function revokeTrustedDevice({ mobile, deviceId }) {
  if (!mobile || !deviceId) return;
  await TrustedDevice.deleteOne({ mobile, deviceId });
}

module.exports = {
  issueTrustedDevice,
  findValidTrustedDevice,
  touchTrustedDevice,
  revokeTrustedDevice,
};
