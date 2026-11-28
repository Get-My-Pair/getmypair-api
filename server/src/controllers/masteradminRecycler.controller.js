const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { success, error: errorResponse, notFound } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');
const { cleanRecyclerInput, cleanAllocation } = require('../utils/recyclerValidation');
const Recycler = require('../models/recycler.model');
const RecycleRequest = require('../models/recycleRequest.model');

const STATUSES = ['pending', 'updated'];

function badId(res) {
  return errorResponse(res, 'Invalid ID format', 400);
}

/** GET /api/masteradmin/recyclers */
const listRecyclers = asyncHandler(async (req, res) => {
  const rows = await Recycler.find().sort({ createdAt: -1 });
  return success(res, 'Recyclers retrieved', { items: rows.map((r) => r.toPublic()) });
});

/** POST /api/masteradmin/recyclers */
const createRecycler = asyncHandler(async (req, res) => {
  const { value, error } = cleanRecyclerInput(req.body, { requirePassword: true });
  if (error) return errorResponse(res, error, 400);

  if (await Recycler.exists({ email: value.email })) {
    return errorResponse(res, 'A recycler with this email already exists', 400);
  }

  const row = await Recycler.create({
    name: value.name,
    email: value.email,
    phone: value.phone,
    organization: value.organization,
    address: value.address,
    passwordHash: await bcrypt.hash(value.password, 10),
    createdBy: 'masteradmin',
    isActive: req.body.isActive !== false,
  });

  return success(res, 'Recycler created', { item: row.toPublic() }, 201);
});

/**
 * PATCH /api/masteradmin/recyclers/:id
 * Partial update: fields not sent keep their current value. Empty password = unchanged.
 */
const updateRecycler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return badId(res);

  const row = await Recycler.findById(id).select('+passwordHash');
  if (!row) return notFound(res, 'Recycler not found');

  const body = req.body || {};
  const merged = {
    name: body.name ?? row.name,
    email: body.email ?? row.email,
    phone: body.phone ?? row.phone,
    organization: body.organization ?? row.organization,
    address: body.address ?? row.address,
    password: body.password || '',
  };
  const { value, error } = cleanRecyclerInput(merged, { requirePassword: false });
  if (error) return errorResponse(res, error, 400);

  if (value.email !== row.email && (await Recycler.exists({ email: value.email, _id: { $ne: row._id } }))) {
    return errorResponse(res, 'A recycler with this email already exists', 400);
  }

  row.name = value.name;
  row.email = value.email;
  row.phone = value.phone;
  row.organization = value.organization;
  row.address = value.address;
  if (typeof body.isActive === 'boolean') row.isActive = body.isActive;
  if (value.password) row.passwordHash = await bcrypt.hash(value.password, 10);
  await row.save();

  return success(res, 'Recycler updated', { item: row.toPublic() });
});

/** DELETE /api/masteradmin/recyclers/:id — past batches are kept. */
const deleteRecycler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return badId(res);
  const row = await Recycler.findByIdAndDelete(id);
  if (!row) return notFound(res, 'Recycler not found');
  return success(res, 'Recycler deleted');
});

/** GET /api/masteradmin/recycler-requests?status=pending|updated */
const listRequests = asyncHandler(async (req, res) => {
  const filter = {};
  if (STATUSES.includes(req.query.status)) filter.status = req.query.status;
  const rows = await RecycleRequest.find(filter).sort({ createdAt: -1 });
  return success(res, 'Recycler requests retrieved', { items: rows.map((r) => r.toPublic()) });
});

/**
 * PATCH /api/masteradmin/recycler-requests/:id/allocate
 * Body: { thriftCount, recycleCount, adminNote? } — must add up to footwearCount.
 */
const allocateRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return badId(res);

  const row = await RecycleRequest.findById(id);
  if (!row) return notFound(res, 'Request not found');

  const { value, error } = cleanAllocation(req.body, row.footwearCount);
  if (error) return errorResponse(res, error, 400);

  row.thriftCount = value.thriftCount;
  row.recycleCount = value.recycleCount;
  row.adminNote = value.adminNote;
  row.status = 'updated';
  row.processedAt = new Date();
  await row.save();

  return success(res, 'Request updated', { item: row.toPublic() });
});

/** DELETE /api/masteradmin/recycler-requests/:id */
const deleteRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return badId(res);
  const row = await RecycleRequest.findByIdAndDelete(id);
  if (!row) return notFound(res, 'Request not found');
  return success(res, 'Request deleted');
});

module.exports = {
  listRecyclers,
  createRecycler,
  updateRecycler,
  deleteRecycler,
  listRequests,
  allocateRequest,
  deleteRequest,
};
