/**
 * Server-side remove.bg proxy — keeps the API key off mobile clients.
 */

const config = require('../config/env');
const logger = require('../utils/logger');

const REMOVE_BG_ENDPOINT = 'https://api.remove.bg/v1.0/removebg';

function isConfigured() {
  return Boolean(config.REMOVE_BG_API_KEY && String(config.REMOVE_BG_API_KEY).trim());
}

/**
 * @param {Buffer} imageBuffer
 * @param {string} [mimeType]
 * @returns {Promise<Buffer>} PNG cutout bytes
 */
async function removeBackground(imageBuffer, mimeType = 'image/jpeg') {
  if (!isConfigured()) {
    const err = new Error('Background removal is not configured on the server');
    err.statusCode = 503;
    throw err;
  }
  if (!imageBuffer || !Buffer.isBuffer(imageBuffer) || imageBuffer.length === 0) {
    const err = new Error('Image file is required');
    err.statusCode = 400;
    throw err;
  }

  const form = new FormData();
  form.append('size', 'auto');
  form.append('format', 'png');
  form.append('type', 'product');
  form.append('crop', 'true');
  form.append('crop_margin', '8%');
  form.append(
    'image_file',
    new Blob([imageBuffer], { type: mimeType || 'image/jpeg' }),
    'footwear.jpg',
  );

  const response = await fetch(REMOVE_BG_ENDPOINT, {
    method: 'POST',
    headers: {
      'X-Api-Key': config.REMOVE_BG_API_KEY,
    },
    body: form,
  });

  if (response.ok) {
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  let detail = `HTTP ${response.status}`;
  try {
    const body = await response.json();
    const first = Array.isArray(body?.errors) ? body.errors[0] : null;
    if (first?.title) {
      detail = first.detail ? `${first.title}: ${first.detail}` : first.title;
    } else if (typeof body?.message === 'string') {
      detail = body.message;
    }
  } catch (_) {
    // ignore parse errors
  }

  logger.warn(`remove.bg failed: ${detail}`);
  const err = new Error(`Background removal failed (${detail})`);
  err.statusCode = response.status >= 400 && response.status < 600 ? response.status : 502;
  throw err;
}

module.exports = {
  isConfigured,
  removeBackground,
};
