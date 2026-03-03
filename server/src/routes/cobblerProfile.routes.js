const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const { uploadProfileImage, uploadKycDoc } = require('../middleware/upload.middleware');
const cobblerProfileController = require('../controllers/cobblerProfile.controller');
const {
    createProfileValidation,
    updateProfileValidation,
    updateShopValidation,
    updateServicesValidation,
    updateToolsValidation,
    updateToolsNeededValidation,
} = require('../validations/cobblerProfile.validation');

// All routes require authentication + COBBER role
router.use(authMiddleware);
router.use(roleMiddleware(['COBBER']));

// ─────────────────────────────────────────────────────────────
// 1. Create Profile
// ─────────────────────────────────────────────────────────────
router.post('/create', createProfileValidation, cobblerProfileController.createProfile);

// ─────────────────────────────────────────────────────────────
// 2. Get Profile
// ─────────────────────────────────────────────────────────────
router.get('/me', cobblerProfileController.getProfile);

// ─────────────────────────────────────────────────────────────
// 3. Update Profile
// ─────────────────────────────────────────────────────────────
router.put('/update', updateProfileValidation, cobblerProfileController.updateProfile);

// ─────────────────────────────────────────────────────────────
// 4. Update Shop Details
// ─────────────────────────────────────────────────────────────
router.put('/shop', updateShopValidation, cobblerProfileController.updateShopDetails);

// ─────────────────────────────────────────────────────────────
// 5. Update Services
// ─────────────────────────────────────────────────────────────
router.put('/services', updateServicesValidation, cobblerProfileController.updateServices);

// ─────────────────────────────────────────────────────────────
// 6. Update Tools Owned
// ─────────────────────────────────────────────────────────────
router.put('/tools-owned', updateToolsValidation, cobblerProfileController.updateToolsOwned);

// ─────────────────────────────────────────────────────────────
// 7. Update Tools Needed
// ─────────────────────────────────────────────────────────────
router.put('/tools-needed', updateToolsNeededValidation, cobblerProfileController.updateToolsNeeded);

// ─────────────────────────────────────────────────────────────
// 8. Upload Profile Image (Cloudinary)
// ─────────────────────────────────────────────────────────────
router.post('/upload-image', uploadProfileImage, cobblerProfileController.uploadProfileImage);

// ─────────────────────────────────────────────────────────────
// 9. Upload KYC Document (Cloudinary)
// ─────────────────────────────────────────────────────────────
router.post('/upload-doc', uploadKycDoc, cobblerProfileController.uploadKycDoc);

// ─────────────────────────────────────────────────────────────
// 10. Get Verification Status
// ─────────────────────────────────────────────────────────────
router.get('/verification', cobblerProfileController.getVerificationStatus);

module.exports = router;
