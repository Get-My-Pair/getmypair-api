/**
 * Input validation for the public Drop Box form.
 * Each validator returns { value } on success or { error } with a user-facing message.
 */

const IMAGE_RE = /^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/;
const MAX_IMAGE_CHARS = 6 * 1024 * 1024; // data URL length cap (~4.5 MB image)
const COUNTRY_CODE_RE = /^\+\d{1,7}$/;

const asString = (v) => (v === undefined || v === null ? '' : String(v));

/** Strict rules for the two markets we know well; everything else just needs a plausible length. */
function checkNationalNumber(countryCode, digits) {
  if (countryCode === '+91') {
    return /^[6-9]\d{9}$/.test(digits)
      ? null
      : 'Enter a valid 10-digit Indian mobile number';
  }
  if (countryCode === '+1') {
    return /^[2-9]\d{9}$/.test(digits) ? null : 'Enter a valid 10-digit phone number';
  }
  if (digits.length < 6 || digits.length > 14) {
    return 'Phone number must be between 6 and 14 digits';
  }
  return null;
}

/** Public submission: photo, name, country code and phone number. */
function cleanSubmission(body = {}) {
  const name = asString(body.name).trim();
  if (!name) return { error: 'Name is required' };
  if (name.length > 100) return { error: 'Name must be 100 characters or fewer' };

  const countryCode = asString(body.countryCode).replace(/\s+/g, '');
  if (!COUNTRY_CODE_RE.test(countryCode)) {
    return { error: 'Select a valid country code' };
  }

  const phoneNumber = asString(body.phoneNumber).replace(/[\s-]+/g, '');
  if (!/^\d+$/.test(phoneNumber)) {
    return { error: 'Phone number can only contain digits' };
  }
  const phoneError = checkNationalNumber(countryCode, phoneNumber);
  if (phoneError) return { error: phoneError };
  if (countryCode.length - 1 + phoneNumber.length > 15) {
    return { error: 'Phone number is too long' };
  }

  const imageUrl = asString(body.imageUrl);
  if (!imageUrl) return { error: 'Upload a photo of your pair' };
  if (imageUrl.length > MAX_IMAGE_CHARS || !IMAGE_RE.test(imageUrl)) {
    return { error: 'Photo must be a JPEG, PNG, WEBP or GIF image under 4.5 MB' };
  }

  return {
    value: {
      name,
      countryCode,
      phoneNumber,
      phone: `${countryCode}${phoneNumber}`,
      imageUrl,
    },
  };
}

/**
 * Location sent from the thank-you page.
 *   { denied: true }                 the visitor declined the browser prompt
 *   { lat, lng, accuracy? }          coordinates from the device
 */
function cleanLocation(body = {}) {
  if (body.denied === true) return { value: { denied: true } };

  const lat = Number(body.lat);
  const lng = Number(body.lng);
  if (body.lat === undefined || body.lng === undefined || body.lat === null || body.lng === null) {
    return { error: 'Latitude and longitude are required' };
  }
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    return { error: 'Latitude must be between -90 and 90' };
  }
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    return { error: 'Longitude must be between -180 and 180' };
  }

  let accuracy = null;
  if (body.accuracy !== undefined && body.accuracy !== null && body.accuracy !== '') {
    accuracy = Number(body.accuracy);
    if (!Number.isFinite(accuracy) || accuracy < 0 || accuracy > 1e7) {
      return { error: 'Accuracy must be a positive number of metres' };
    }
    accuracy = Math.round(accuracy);
  }

  return {
    value: {
      denied: false,
      lat: Math.round(lat * 1e6) / 1e6,
      lng: Math.round(lng * 1e6) / 1e6,
      accuracy,
    },
  };
}

module.exports = {
  cleanSubmission,
  cleanLocation,
};
