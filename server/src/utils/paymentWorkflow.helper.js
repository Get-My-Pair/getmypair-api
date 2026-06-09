/**
 * Sync workflowStatus / paymentState on ServiceRequest documents.
 */
const { ServiceRequest } = require('../models/serviceRequest.model');

async function updateServiceWorkflow(serviceRequestId, patch, lifecycleNote = null) {
  const request = await ServiceRequest.findById(serviceRequestId);
  if (!request) return null;

  Object.assign(request, patch);
  if (lifecycleNote) {
    request.lifecycleEvents = Array.isArray(request.lifecycleEvents) ? request.lifecycleEvents : [];
    request.lifecycleEvents.push({
      state: request.trackingState || 'request_created',
      status: request.status,
      actorType: lifecycleNote.actorType || 'system',
      actorId: lifecycleNote.actorId || null,
      note: lifecycleNote.note,
      media: { photos: [], videos: [] },
      timestamp: new Date(),
    });
  }
  request.trackingUpdatedAt = new Date();
  await request.save();
  return request;
}

function resolveProviderType(request) {
  if (request.workflowStatus === 'ESCALATED_TO_GMP') return 'gmp';
  if (request.routingType === 'direct' || request.cobblerId) return 'cobbler';
  if (request.darkStoreId) return 'dark_store';
  return request.cobblerId ? 'cobbler' : 'dark_store';
}

module.exports = { updateServiceWorkflow, resolveProviderType };
