const { success, error: errorResponse, notFound } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');
const DropBoxRequest = require('../models/dropBoxRequest.model');

const OBJECT_ID_RE = /^[a-f\d]{24}$/i;
const MAX_ROWS = 500;

/** GET /api/masteradmin/dropbox-requests — newest first */
const listRequests = asyncHandler(async (req, res) => {
  const rows = await DropBoxRequest.find({}).sort({ createdAt: -1 }).limit(MAX_ROWS);
  return success(res, 'Drop box requests retrieved', { items: rows.map((r) => r.toPublic()) });
});

/** DELETE /api/masteradmin/dropbox-requests/:id */
const deleteRequest = asyncHandler(async (req, res) => {
  if (!OBJECT_ID_RE.test(req.params.id)) return errorResponse(res, 'Invalid ID format', 400);
  const row = await DropBoxRequest.findByIdAndDelete(req.params.id);
  if (!row) return notFound(res, 'Drop box request not found');
  return success(res, 'Drop box request deleted');
});

module.exports = {
  listRequests,
  deleteRequest,
};
