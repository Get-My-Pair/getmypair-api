/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : cobblerProfile.routes.js
 * Description: Cobbler profile routes – create, me, update, shop, services, tools, upload, verification
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
