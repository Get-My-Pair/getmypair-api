/**
 * GMP display / order codes:
 *   CH SH WA 1234 AM  →  CHSHWA1234AM
 *   CH = city (Chennai), SH = shoe, WA = wash, 1234 = seq, AM = hub/area (Ambattur)
 */
const SequenceCounter = require('../models/sequenceCounter.model');
const HubSettings = require('../models/hubSettings.model');
const logger = require('./logger');

const PRODUCT_CODE = 'SH';

const CITY_CODES = {
  chennai: 'CH',
  bangalore: 'BL',
  bengaluru: 'BL',
  mumbai: 'MU',
  delhi: 'DL',
  newdelhi: 'DL',
  hyderabad: 'HY',
  kolkata: 'KO',
  pune: 'PU',
  coimbatore: 'CB',
  madurai: 'MD',
  trichy: 'TY',
  tiruchirappalli: 'TY',
  salem: 'SL',
  mysore: 'MY',
  mysuru: 'MY',
  chandigarh: 'CD',
  jaipur: 'JP',
  ahmedabad: 'AH',
  surat: 'SU',
  lucknow: 'LK',
  indore: 'IN',
  nagpur: 'NG',
  visakhapatnam: 'VZ',
  vizag: 'VZ',
};

const SERVICE_CODES = {
  repair: 'RE',
  maintenance: 'MA',
  wash: 'WA',
  donate: 'DO',
  dispose: 'DI',
};

function lettersOnly(raw) {
  return String(raw || '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '');
}

function toCityCode(city) {
  const key = String(city || '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
  if (CITY_CODES[key]) return CITY_CODES[key];
  const letters = lettersOnly(city);
  if (letters.length >= 2) return letters.slice(0, 2);
  return 'IN';
}

function toServiceCode(serviceType) {
  const key = String(serviceType || '')
    .toLowerCase()
    .trim();
  return SERVICE_CODES[key] || 'SV';
}

function toAreaCode(hubOrArea) {
  if (!hubOrArea) return 'HQ';
  if (typeof hubOrArea === 'object') {
    const explicit = lettersOnly(hubOrArea.areaCode || hubOrArea.code);
    if (explicit.length >= 2) return explicit.slice(0, 2);
    const fromName = lettersOnly(hubOrArea.name);
    if (fromName.length >= 2) return fromName.slice(0, 2);
    return 'HQ';
  }
  const letters = lettersOnly(hubOrArea);
  if (letters.length >= 2) return letters.slice(0, 2);
  return 'HQ';
}

async function nextSequence(name = 'gmp_public_id') {
  const doc = await SequenceCounter.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return Number(doc.seq) || 1;
}

function formatPublicId({ cityCode, serviceCode, seq, areaCode }) {
  const city = String(cityCode || 'IN')
    .toUpperCase()
    .slice(0, 2)
    .padEnd(2, 'X');
  const service = String(serviceCode || 'SV')
    .toUpperCase()
    .slice(0, 2)
    .padEnd(2, 'X');
  const area = String(areaCode || 'HQ')
    .toUpperCase()
    .slice(0, 2)
    .padEnd(2, 'X');
  const num = String(Math.abs(Number(seq) || 1) % 10000).padStart(4, '0');
  return `${city}${PRODUCT_CODE}${service}${num}${area}`;
}

/**
 * Prefer hub matching address city; else first active hub; else null.
 */
async function resolveHubForAddress(address) {
  const city = String(address?.city || '').trim();
  if (city) {
    const byCity = await HubSettings.findOne({
      isActive: { $ne: false },
      city: new RegExp(`^${city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
    })
      .sort({ updatedAt: -1 })
      .lean();
    if (byCity) return byCity;
  }
  return HubSettings.findOne({ isActive: { $ne: false } })
    .sort({ updatedAt: -1 })
    .lean();
}

async function allocatePublicId({ serviceType, address, hub } = {}) {
  const resolvedHub = hub || (await resolveHubForAddress(address));
  const citySource = address?.city || resolvedHub?.city || '';
  const cityCode = toCityCode(citySource);
  const serviceCode = toServiceCode(serviceType);
  const areaCode = toAreaCode(resolvedHub || address?.city || 'HQ');
  const seq = await nextSequence('gmp_public_id');
  const publicId = formatPublicId({ cityCode, serviceCode, seq, areaCode });
  return {
    publicId,
    cityCode,
    productCode: PRODUCT_CODE,
    serviceCode,
    areaCode,
    seq: seq % 10000,
  };
}

/**
 * Ensure ServiceRequest has a stable publicId (backfill for older docs).
 */
async function ensurePublicId(request, { address } = {}) {
  if (!request) return null;
  if (request.publicId && String(request.publicId).trim()) {
    return String(request.publicId).trim().toUpperCase();
  }
  try {
    const allocated = await allocatePublicId({
      serviceType: request.serviceType,
      address,
    });
    request.publicId = allocated.publicId;
    if (typeof request.save === 'function') {
      await request.save();
    } else if (request._id) {
      const { ServiceRequest } = require('../models/serviceRequest.model');
      await ServiceRequest.updateOne(
        { _id: request._id },
        { $set: { publicId: allocated.publicId } }
      );
    }
    return allocated.publicId;
  } catch (err) {
    logger.warn(`ensurePublicId failed: ${err.message}`);
    return null;
  }
}

/**
 * Payment orderId: reuse request.publicId when free; else mint a new coded id.
 */
async function allocatePaymentOrderId(request, PaymentModel) {
  const publicId = await ensurePublicId(request);
  if (publicId) {
    const clash = await PaymentModel.findOne({ orderId: publicId })
      .select('_id')
      .lean();
    if (!clash) return publicId;
  }
  const allocated = await allocatePublicId({
    serviceType: request.serviceType,
  });
  return allocated.publicId;
}

module.exports = {
  PRODUCT_CODE,
  CITY_CODES,
  SERVICE_CODES,
  toCityCode,
  toServiceCode,
  toAreaCode,
  formatPublicId,
  nextSequence,
  resolveHubForAddress,
  allocatePublicId,
  ensurePublicId,
  allocatePaymentOrderId,
};
