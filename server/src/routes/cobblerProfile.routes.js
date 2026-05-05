/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : cobblerProfile.routes.js
 * Description: Cobbler profile routes – me, update, booth, services, tools, upload, verification (profile created by auth)
 * ----------------------------------------------------------------------------
 * Developer  : C Ranjith Kumar
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
    updateProfileValidation,
    updateShopValidation,
    updateServicesValidation,
    updateToolsValidation,
    updateToolsNeededValidation,
    updateBankValidation,
    updateStatusValidation,
} = require('../validations/cobblerProfile.validation');

// All routes require authentication
router.use(authMiddleware);

// Nearby discovery route is used by mobile map for USER/ADMIN/COBBER roles.
router.get(
    '/nearby',
    roleMiddleware(['USER', 'ADMIN', 'COBBER']),
    cobblerProfileController.getNearbyCobblers
);

// Remaining routes are cobbler-only profile management APIs.
router.use(roleMiddleware(['COBBER']));

// Profile row is created only by POST /api/auth/complete-profile — use PUT below to edit.

// ─────────────────────────────────────────────────────────────
// 1. Get Profile
// ─────────────────────────────────────────────────────────────
router.get('/me', cobblerProfileController.getProfile);

// ─────────────────────────────────────────────────────────────
// 2. Update Profile (does not create; 404 if profile missing)
// ─────────────────────────────────────────────────────────────
router.put('/', updateProfileValidation, cobblerProfileController.updateProfile);
router.put('/update', updateProfileValidation, cobblerProfileController.updateProfile);

// ─────────────────────────────────────────────────────────────
// 3. Update Booth Details (Booth name with number, Booth address)
// ─────────────────────────────────────────────────────────────
router.put('/shop', updateShopValidation, cobblerProfileController.updateShopDetails);

// ─────────────────────────────────────────────────────────────
// 4. Update Services
// ─────────────────────────────────────────────────────────────
router.put('/services', updateServicesValidation, cobblerProfileController.updateServices);

// ─────────────────────────────────────────────────────────────
// 5. Update Tools Owned
// ─────────────────────────────────────────────────────────────
router.put('/tools-owned', updateToolsValidation, cobblerProfileController.updateToolsOwned);

// ─────────────────────────────────────────────────────────────
// 6. Update Tools Needed
// ─────────────────────────────────────────────────────────────
router.put('/tools-needed', updateToolsNeededValidation, cobblerProfileController.updateToolsNeeded);

// ─────────────────────────────────────────────────────────────
// 7. Update Bank Details
// ─────────────────────────────────────────────────────────────
router.put('/bank', updateBankValidation, cobblerProfileController.updateBankDetails);

// ─────────────────────────────────────────────────────────────
// 8. Upload Profile Image (Cloudinary)
// ─────────────────────────────────────────────────────────────
router.post('/upload-image', uploadProfileImage, cobblerProfileController.uploadProfileImage);

// ─────────────────────────────────────────────────────────────
// 9. Upload KYC Document (Cloudinary)
// ─────────────────────────────────────────────────────────────
router.post('/upload-doc', uploadKycDoc, cobblerProfileController.uploadKycDoc);

// ─────────────────────────────────────────────────────────────
// 10. Update online status
// ─────────────────────────────────────────────────────────────
router.put('/update-status', updateStatusValidation, cobblerProfileController.updateStatus);

// ─────────────────────────────────────────────────────────────
// 11. Get Verification Status
// ─────────────────────────────────────────────────────────────
router.get('/verification', cobblerProfileController.getVerificationStatus);

module.exports = router;
