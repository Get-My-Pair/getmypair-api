/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : userProfile.routes.js
 * Description: User profile routes – me, update, upload-image, address CRUD (profile created by auth)
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
const { uploadProfileImage } = require('../middleware/upload.middleware');
const userProfileController = require('../controllers/userProfile.controller');
const {
    updateProfileValidation,
    addAddressValidation,
    updateAddressValidation,
} = require('../validations/userProfile.validation');

// All routes require authentication + USER role
router.use(authMiddleware);
router.use(roleMiddleware(['USER']));

// Profile row is created only by POST /api/auth/complete-profile — use PUT below to edit.

// ─────────────────────────────────────────────────────────────
// 1. Get Profile
// ─────────────────────────────────────────────────────────────
router.get('/me', userProfileController.getProfile);

// ─────────────────────────────────────────────────────────────
// 2. List addresses
// ─────────────────────────────────────────────────────────────
router.get('/addresses', userProfileController.listAddresses);

// ─────────────────────────────────────────────────────────────
// 3. Update Profile (does not create; 404 if profile missing)
// ─────────────────────────────────────────────────────────────
router.put('/', updateProfileValidation, userProfileController.updateProfile);
router.put('/update', updateProfileValidation, userProfileController.updateProfile);

// ─────────────────────────────────────────────────────────────
// 4. Upload Profile Image (Cloudinary)
// ─────────────────────────────────────────────────────────────
router.post('/upload-image', uploadProfileImage, userProfileController.uploadProfileImage);

// ─────────────────────────────────────────────────────────────
// 5. Add Address
// ─────────────────────────────────────────────────────────────
router.post('/address/add', addAddressValidation, userProfileController.addAddress);

// ─────────────────────────────────────────────────────────────
// 6. Update Address
// ─────────────────────────────────────────────────────────────
router.put('/address/update', updateAddressValidation, userProfileController.updateAddress);

// ─────────────────────────────────────────────────────────────
// 7. Delete Address
// ─────────────────────────────────────────────────────────────
router.delete('/address/delete/:addressId', userProfileController.deleteAddress);

module.exports = router;
