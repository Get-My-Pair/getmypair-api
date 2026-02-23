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

/**
 * @swagger
 * tags:
 *   name: User Profile
 *   description: User profile management APIs (7 APIs) — Role required **USER**
 */

// ─────────────────────────────────────────────────────────────
// 1. Create Profile
// ─────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/user/profile/create:
 *   post:
 *     summary: Create user profile
 *     description: |
 *       Create a new user profile for the authenticated user.
 *       Each user can have only one profile. Returns `409` if profile already exists.
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, phone]
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: "John Doe"
 *               phone:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 15
 *                 example: "9876543210"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *     responses:
 *       201:
 *         description: Profile created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "User profile created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     profile:
 *                       $ref: '#/components/schemas/UserProfile'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: Unauthorized — missing or invalid JWT
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Profile already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/create', createProfileValidation, userProfileController.createProfile);

// ─────────────────────────────────────────────────────────────
// 2. Get Profile
// ─────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/user/profile/me:
 *   get:
 *     summary: Get own profile
 *     description: Retrieve the authenticated user's profile including all addresses.
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "User profile retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     profile:
 *                       $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Profile not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/me', userProfileController.getProfile);

// ─────────────────────────────────────────────────────────────
// 3. Update Profile
// ─────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/user/profile/update:
 *   put:
 *     summary: Update user profile
 *     description: Update the user's name and/or email. Only provided fields are updated.
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: "John Updated"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.updated@example.com"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "User profile updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     profile:
 *                       $ref: '#/components/schemas/UserProfile'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found
 */
router.put('/update', updateProfileValidation, userProfileController.updateProfile);

// ─────────────────────────────────────────────────────────────
// 4. Upload Profile Image (Cloudinary)
// ─────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/user/profile/upload-image:
 *   post:
 *     summary: Upload profile image
 *     description: |
 *       Upload a profile image for the authenticated user.
 *       Image is uploaded to **Cloudinary** (`getmypair/profiles` folder).
 *       If a previous image exists, it is automatically deleted from Cloudinary.
 *       **Allowed types:** JPEG, JPG, PNG, WEBP — **Max:** 5MB.
 *       Images are auto-optimized to max 500×500px.
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Profile image file (JPEG/PNG/WEBP, max 5MB)
 *     responses:
 *       200:
 *         description: Image uploaded to Cloudinary successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Profile image uploaded successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     profileImage:
 *                       type: string
 *                       example: "https://res.cloudinary.com/xxx/image/upload/v1/getmypair/profiles/user-664a1b2c-1708700000.jpg"
 *                     cloudinaryId:
 *                       type: string
 *                       example: "getmypair/profiles/user-664a1b2c-1708700000"
 *       400:
 *         description: No file uploaded or invalid file type
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found — create profile first
 */
router.post('/upload-image', uploadProfileImage, userProfileController.uploadProfileImage);

// ─────────────────────────────────────────────────────────────
// 5. Add Address
// ─────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/user/profile/address/add:
 *   post:
 *     summary: Add address
 *     description: Add a new address to the user's profile. A user can have multiple addresses.
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [addressLine1, city, state, pincode]
 *             properties:
 *               addressLine1:
 *                 type: string
 *                 example: "123 Main Street, Sector 5"
 *               city:
 *                 type: string
 *                 example: "Mumbai"
 *               state:
 *                 type: string
 *                 example: "Maharashtra"
 *               pincode:
 *                 type: string
 *                 example: "400001"
 *     responses:
 *       201:
 *         description: Address added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Address added successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     address:
 *                       $ref: '#/components/schemas/Address'
 *                     totalAddresses:
 *                       type: integer
 *                       example: 2
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found — create profile first
 */
router.post('/address/add', addAddressValidation, userProfileController.addAddress);

// ─────────────────────────────────────────────────────────────
// 6. Update Address
// ─────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/user/profile/address/update:
 *   put:
 *     summary: Update address
 *     description: Update an existing address by its addressId. Only provided fields are updated.
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [addressId]
 *             properties:
 *               addressId:
 *                 type: string
 *                 description: MongoDB ObjectId of the address to update
 *                 example: "664a1b2c3d4e5f6a7b8c9d10"
 *               addressLine1:
 *                 type: string
 *                 example: "456 New Street, Sector 12"
 *               city:
 *                 type: string
 *                 example: "Delhi"
 *               state:
 *                 type: string
 *                 example: "Delhi"
 *               pincode:
 *                 type: string
 *                 example: "110001"
 *     responses:
 *       200:
 *         description: Address updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Address updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     address:
 *                       $ref: '#/components/schemas/Address'
 *       400:
 *         description: Validation error or addressId missing
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile or address not found
 */
router.put('/address/update', updateAddressValidation, userProfileController.updateAddress);

// ─────────────────────────────────────────────────────────────
// 7. Delete Address
// ─────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/user/profile/address/delete/{addressId}:
 *   delete:
 *     summary: Delete address
 *     description: Delete an address from the user's profile by addressId.
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the address to delete
 *         example: "664a1b2c3d4e5f6a7b8c9d10"
 *     responses:
 *       200:
 *         description: Address deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Address deleted successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalAddresses:
 *                       type: integer
 *                       example: 1
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile or address not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/address/delete/:addressId', userProfileController.deleteAddress);

module.exports = router;
