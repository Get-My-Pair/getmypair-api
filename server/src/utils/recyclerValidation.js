/**
 * Input validation for recycler accounts and bulk recycle requests.
 * Each validator returns { value } on success or { error } with a user-facing message.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const IMAGE_RE = /^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/;
const MAX_IMAGE_CHARS = 6 * 1024 * 1024; // data URL length cap (~4.5 MB image)
const MAX_FOOTWEAR = 100000;
const MAX_WEIGHT_KG = 100000;

const asString = (v) => (v === undefined || v === null ? '' : String(v));

function readText(value, label, { max, required = false }) {
  const s = asString(value).trim();
  if (required && !s) return { error: `${label} is required` };
  if (s.length > max) return { error: `${label} must be ${max} characters or fewer` };
  return { value: s };
}

/**
 * Recycler account fields. Password is required on create; on update an empty
 * password means "keep the current one".
 */
function cleanRecyclerInput(body = {}, { requirePassword }) {
  const name = readText(body.name, 'Name', { max: 100, required: true });
  if (name.error) return name;

  const email = readText(body.email, 'Email', { max: 254, required: true });
  if (email.error) return email;
  const emailLower = email.value.toLowerCase();
  if (!EMAIL_RE.test(emailLower)) return { error: 'Enter a valid email address' };

  const phone = asString(body.phone).replace(/\s+/g, '');
  if (phone && !/^\d{10}$/.test(phone)) {
    return { error: 'Phone must be a 10-digit mobile number' };
  }

  const organization = readText(body.organization, 'Organisation', { max: 150 });
  if (organization.error) return organization;
  const address = readText(body.address, 'Address', { max: 300 });
  if (address.error) return address;

  const password = typeof body.password === 'string' ? body.password : '';
  if (requirePassword || password) {
    if (password.length < 6) return { error: 'Password must be at least 6 characters' };
    if (password.length > 72) return { error: 'Password must be 72 characters or fewer' };
  }

  return {
    value: {
      name: name.value,
      email: emailLower,
      phone,
      organization: organization.value,
      address: address.value,
      password,
    },
  };
}

/** Recycler batch submission. */
function cleanRequestInput(body = {}) {
  const name = readText(body.name, 'Name', { max: 120, required: true });
  if (name.error) return name;

  const footwearCount = Number(body.footwearCount);
  if (!Number.isInteger(footwearCount) || footwearCount < 1 || footwearCount > MAX_FOOTWEAR) {
    return { error: `Footwear count must be a whole number between 1 and ${MAX_FOOTWEAR}` };
  }

  const weightKg = Number(body.weightKg);
  if (!Number.isFinite(weightKg) || weightKg <= 0 || weightKg > MAX_WEIGHT_KG) {
    return { error: `Weight (kg) must be greater than 0 and at most ${MAX_WEIGHT_KG}` };
  }

  const date = asString(body.date).trim();
  if (!DATE_RE.test(date)) return { error: 'Select a valid date' };
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return { error: 'Select a valid date' };
  if (parsed.getTime() > Date.now() + 24 * 60 * 60 * 1000) {
    return { error: 'Date cannot be in the future' };
  }

  const imageUrl = asString(body.imageUrl);
  if (!imageUrl) return { error: 'Upload a photo of the footwear' };
  if (imageUrl.length > MAX_IMAGE_CHARS || !IMAGE_RE.test(imageUrl)) {
    return { error: 'Photo must be a JPEG, PNG, WEBP or GIF image under 4.5 MB' };
  }

  return {
    value: { name: name.value, footwearCount, weightKg: Math.round(weightKg * 100) / 100, date, imageUrl },
  };
}

/** Masteradmin split: thrift + recycle must equal the footwear given. */
function cleanAllocation(body = {}, footwearCount) {
  const thrift = Number(body.thriftCount);
  const recycle = Number(body.recycleCount);
  if (!Number.isInteger(thrift) || thrift < 0) {
    return { error: 'Thrift store count must be a whole number (0 or more)' };
  }
  if (!Number.isInteger(recycle) || recycle < 0) {
    return { error: 'Recycle count must be a whole number (0 or more)' };
  }
  if (thrift + recycle !== footwearCount) {
    return {
      error: `Thrift store (${thrift}) + Recycle (${recycle}) must equal the footwear given (${footwearCount})`,
    };
  }
  const note = readText(body.adminNote, 'Note', { max: 500 });
  if (note.error) return note;
  return { value: { thriftCount: thrift, recycleCount: recycle, adminNote: note.value } };
}

module.exports = {
  cleanRecyclerInput,
  cleanRequestInput,
  cleanAllocation,
};
