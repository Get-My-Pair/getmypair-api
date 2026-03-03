const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const { uploadProfileImage } = require('../middleware/upload.middleware');
const userProfileController = require('../controllers/userProfile.controller');
const {
    createProfileValidation,
    updateProfileValidation,
    addAddressValidation,
    updateAddressValidation,
} = require('../validations/userProfile.validation');

// All routes require authentication + USER role
router.use(authMiddleware);
router.use(roleMiddleware(['USER']));

// ─────────────────────────────────────────────────────────────
// 1. Create Profile
// ─────────────────────────────────────────────────────────────
router.post('/create', createProfileValidation, userProfileController.createProfile);

// ─────────────────────────────────────────────────────────────
// 2. Get Profile
// ─────────────────────────────────────────────────────────────
router.get('/me', userProfileController.getProfile);

// ─────────────────────────────────────────────────────────────
// 3. Update Profile
// ─────────────────────────────────────────────────────────────
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
