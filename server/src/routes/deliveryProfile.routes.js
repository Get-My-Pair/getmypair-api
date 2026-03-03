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
