/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : deliveryProfile.routes.js
 * Description: Delivery profile routes – create, me, update, vehicle, upload-doc, upload-image, verification
 * ----------------------------------------------------------------------------
 * Developer  : C Ranjith Kumar
 * Role       : Backend and Database Developer, Team Lead
 * ----------------------------------------------------------------------------
 * LinkedIn         : https://www.linkedin.com/in/coding-ranjith/
 * Personal GitHub  : https://github.com/CodingRanjith
 * Project GitHub   : https://github.com/Ranjithgmp
 * Personal Email   : ranjith.c96me@gmail.com
 * Project Email    : ranjith.kumar@getmypair.com
 * ----------------------------------------------------------------------------
 * Last modified : 2025-03-03
 * ----------------------------------------------------------------------------
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const { uploadProfileImage, uploadDeliveryDoc } = require('../middleware/upload.middleware');
const deliveryProfileController = require('../controllers/deliveryProfile.controller');
const {
    createProfileValidation,
    updateProfileValidation,
    updateVehicleValidation,
} = require('../validations/deliveryProfile.validation');

// All routes require authentication + DELIVERY role
router.use(authMiddleware);
router.use(roleMiddleware(['DELIVERY']));

router.post('/create', createProfileValidation, deliveryProfileController.createProfile);
router.get('/me', deliveryProfileController.getProfile);
router.put('/update', updateProfileValidation, deliveryProfileController.updateProfile);
router.put('/vehicle', updateVehicleValidation, deliveryProfileController.updateVehicleDetails);
router.post('/upload-doc', uploadDeliveryDoc, deliveryProfileController.uploadDocument);
router.post('/upload-image', uploadProfileImage, deliveryProfileController.uploadProfileImage);
router.get('/verification', deliveryProfileController.getVerificationStatus);

module.exports = router;
