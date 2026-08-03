/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : retailer.routes.js
 * Description: Retailer App APIs (/api/retailer)
 *              Currently reuses mobile ADMIN profile handlers.
 *              Future retailer-only APIs: empty stubs below.
 * ----------------------------------------------------------------------------
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const adminProfileController = require('../controllers/adminProfile.controller');
const {
  verifyProfileValidation,
  updateStatusValidation,
} = require('../validations/adminProfile.validation');

// Existing retailer / mobile ADMIN profile management
router.use(authMiddleware);
router.use(roleMiddleware(['ADMIN']));

router.get('/profile/users', adminProfileController.getAllUsers);
router.get('/profile/cobblers', adminProfileController.getAllCobblers);
router.get('/profile/delivery', adminProfileController.getAllDeliveryPartners);
router.get('/profile/:id', adminProfileController.getProfileById);
router.put('/profile/verify', verifyProfileValidation, adminProfileController.verifyProfile);
router.put('/profile/status', updateStatusValidation, adminProfileController.updateAccountStatus);

// ---------------------------------------------------------------------------
// Future Retailer APIs (catalog, orders, storefront, etc.)
// Intentionally empty — implement when product requirements are ready.
// ---------------------------------------------------------------------------

module.exports = router;
