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
const serviceController = require('../controllers/service.controller');
const { createServiceRequestValidation, assignDeliveryValidation } = require('../validations/service.validation');

router.use(authMiddleware);

router.get('/my', roleMiddleware(['USER']), serviceController.getMyServiceRequests);
router.get('/estimation-defaults', roleMiddleware(['USER']), serviceController.getEstimationDefaults);
router.post('/create', roleMiddleware(['USER']), createServiceRequestValidation, serviceController.createServiceRequest);
router.post(
  '/assign-delivery',
  roleMiddleware(['ADMIN', 'COBBER']),
  assignDeliveryValidation,
  serviceController.assignDeliveryPartner
);

module.exports = router;

