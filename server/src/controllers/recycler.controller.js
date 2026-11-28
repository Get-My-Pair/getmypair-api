const bcrypt = require('bcryptjs');
const { success, error: errorResponse } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');
const { cleanRecyclerInput, cleanRequestInput } = require('../utils/recyclerValidation');
const Recycler = require('../models/recycler.model');
const RecycleRequest = require('../models/recycleRequest.model');
const { signRecyclerToken } = require('../middleware/recycler.middleware');

/** POST /api/recycler/auth/register */
const register = asyncHandler(async (req, res) => {
  const { value, error } = cleanRecyclerInput(req.body, { requirePassword: true });
  if (error) return errorResponse(res, error, 400);

  if (await Recycler.exists({ email: value.email })) {
    return errorResponse(res, 'A recycler with this email already exists', 400);
  }

  const recycler = await Recycler.create({
    name: value.name,
    email: value.email,
    phone: value.phone,
    organization: value.organization,
    address: value.address,
    passwordHash: await bcrypt.hash(value.password, 10),
    createdBy: 'self',
  });

  return success(res, 'Recycler account created', { recycler: recycler.toPublic() }, 201);
});

/** POST /api/recycler/auth/login */
const login = asyncHandler(async (req, res) => {
  const email = asString(req.body.email).trim().toLowerCase();
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  if (!email || !password) {
    return errorResponse(res, 'Email and password are required', 400);
  }

  const recycler = await Recycler.findOne({ email }).select('+passwordHash');
  const matches = recycler ? await bcrypt.compare(password, recycler.passwordHash) : false;
  if (!matches) {
    return errorResponse(res, 'Invalid email or password', 401);
  }
  if (!recycler.isActive) {
    return errorResponse(res, 'This account is disabled. Contact the GetMyPair admin.', 403);
  }

  return success(res, 'Login successful', {
    accessToken: signRecyclerToken(recycler),
    recycler: recycler.toPublic(),
  });
});

/** GET /api/recycler/auth/me */
const me = (req, res) =>
  success(res, 'Recycler profile retrieved', { recycler: req.recycler.toPublic() });

/** GET /api/recycler/requests — only the signed-in recycler's batches */
const listMyRequests = asyncHandler(async (req, res) => {
  const rows = await RecycleRequest.find({ recycler: req.recycler._id }).sort({ createdAt: -1 });
  return success(res, 'Submissions retrieved', { items: rows.map((r) => r.toPublic()) });
});

/** POST /api/recycler/requests */
const createRequest = asyncHandler(async (req, res) => {
  const { value, error } = cleanRequestInput(req.body);
  if (error) return errorResponse(res, error, 400);

  const row = await RecycleRequest.create({
    ...value,
    recycler: req.recycler._id,
    recyclerName: req.recycler.name,
    recyclerOrganization: req.recycler.organization || '',
  });

  return success(res, 'Batch submitted', { item: row.toPublic() }, 201);
});

function asString(v) {
  return v === undefined || v === null ? '' : String(v);
}

module.exports = {
  register,
  login,
  me,
  listMyRequests,
  createRequest,
};
