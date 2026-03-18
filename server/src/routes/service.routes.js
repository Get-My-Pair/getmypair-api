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
const { createServiceRequestValidation } = require('../validations/service.validation');

router.use(authMiddleware);
router.use(roleMiddleware(['USER']));

router.get('/my', serviceController.getMyServiceRequests);
router.get('/estimation-defaults', serviceController.getEstimationDefaults);
router.post('/create', createServiceRequestValidation, serviceController.createServiceRequest);

module.exports = router;

