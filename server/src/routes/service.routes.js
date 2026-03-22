/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : service.routes.js
 * Description: Module 4 – Service Request routes
 * ----------------------------------------------------------------------------
 */

const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const {
  uploadServiceProofImage: uploadServiceProofImageMw,
  uploadServiceProofVideo: uploadServiceProofVideoMw,
} = require('../middleware/upload.middleware');
const serviceController = require('../controllers/service.controller');
const {
  createServiceRequestValidation,
  getServiceRequestDetailsValidation,
  assignDeliveryValidation,
  assignDarkStoreValidation,
  updateServiceStatusValidation,
  cancelServiceRequestValidation,
  uploadServiceMediaValidation,
} = require('../validations/service.validation');

router.use(authMiddleware);

router.get('/my', roleMiddleware(['USER']), serviceController.getMyServiceRequests);
router.get('/estimation-defaults', roleMiddleware(['USER']), serviceController.getEstimationDefaults);
router.post('/create', roleMiddleware(['USER']), createServiceRequestValidation, serviceController.createServiceRequest);
router.post(
  '/upload-proof/image',
  roleMiddleware(['USER']),
  uploadServiceProofImageMw,
  serviceController.uploadServiceProofImage
);
router.post(
  '/upload-proof/video',
  roleMiddleware(['USER']),
  uploadServiceProofVideoMw,
  serviceController.uploadServiceProofVideo
);
router.post(
  '/assign-delivery',
  roleMiddleware(['ADMIN', 'COBBER']),
  assignDeliveryValidation,
  serviceController.assignDeliveryPartner
);
router.post(
  '/assign-darkstore',
  roleMiddleware(['ADMIN', 'COBBER']),
  assignDarkStoreValidation,
  serviceController.assignDarkStore
);
router.post(
  '/update-status',
  roleMiddleware(['ADMIN', 'COBBER']),
  updateServiceStatusValidation,
  serviceController.updateServiceStatus
);
router.put(
  '/cancel/:requestId',
  roleMiddleware(['USER', 'ADMIN', 'COBBER']),
  cancelServiceRequestValidation,
  serviceController.cancelServiceRequest
);
router.post(
  '/upload-media',
  roleMiddleware(['ADMIN', 'COBBER', 'DELIVERY']),
  uploadServiceMediaValidation,
  serviceController.uploadServiceMedia
);
router.get('/:requestId', roleMiddleware(['USER', 'ADMIN', 'COBBER']), getServiceRequestDetailsValidation, serviceController.getServiceRequestDetails);

module.exports = router;

