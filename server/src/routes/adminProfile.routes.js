/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : adminProfile.routes.js
 * Description: Admin routes – users, cobblers, delivery list; get by id; verify; status
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
const adminProfileController = require('../controllers/adminProfile.controller');
const {
    verifyProfileValidation,
    updateStatusValidation,
} = require('../validations/adminProfile.validation');

// All routes require authentication + ADMIN role
router.use(authMiddleware);
router.use(roleMiddleware(['ADMIN']));

router.get('/users', adminProfileController.getAllUsers);
router.get('/cobblers', adminProfileController.getAllCobblers);
router.get('/delivery', adminProfileController.getAllDeliveryPartners);
router.get('/:id', adminProfileController.getProfileById);
router.put('/verify', verifyProfileValidation, adminProfileController.verifyProfile);
router.put('/status', updateStatusValidation, adminProfileController.updateAccountStatus);

module.exports = router;
