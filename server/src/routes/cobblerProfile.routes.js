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

/**
 * @swagger
 * tags:
 *   name: Cobbler Profile
 *   description: Cobbler profile management APIs (10 APIs) — Role required **COBBER**
 */

// ─────────────────────────────────────────────────────────────
// 1. Create Profile
// ─────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/cobbler/profile/create:
 *   post:
 *     summary: Create cobbler profile
 *     description: |
 *       Create a new cobbler profile for the authenticated cobbler.
 *       Each cobbler can have only one profile. Returns `409` if profile already exists.
 *     tags: [Cobbler Profile]
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
 *                 example: "Raju Cobbler"
 *               phone:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 15
 *                 example: "9876543210"
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
 *                   example: "Cobbler profile created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     profile:
 *                       $ref: '#/components/schemas/CobblerProfile'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: Unauthorized — missing or invalid JWT
 *       403:
 *         description: Forbidden — requires COBBER role
 *       409:
 *         description: Profile already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/create', createProfileValidation, cobblerProfileController.createProfile);

// ─────────────────────────────────────────────────────────────
// 2. Get Profile
// ─────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/cobbler/profile/me:
 *   get:
 *     summary: Get own cobbler profile
 *     description: Retrieve the authenticated cobbler's complete profile including shop details, services, tools, KYC docs, and verification status.
 *     tags: [Cobbler Profile]
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
 *                   example: "Cobbler profile retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     profile:
 *                       $ref: '#/components/schemas/CobblerProfile'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/me', cobblerProfileController.getProfile);

// ─────────────────────────────────────────────────────────────
// 3. Update Profile
// ─────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/cobbler/profile/update:
 *   put:
 *     summary: Update cobbler profile
 *     description: Update basic profile info (name, phone). Only provided fields are updated.
 *     tags: [Cobbler Profile]
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
 *                 example: "Raju Updated"
 *               phone:
 *                 type: string
 *                 example: "9876543211"
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
 *                   example: "Cobbler profile updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     profile:
 *                       $ref: '#/components/schemas/CobblerProfile'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found
 */
router.put('/update', updateProfileValidation, cobblerProfileController.updateProfile);

// ─────────────────────────────────────────────────────────────
// 4. Update Shop Details
// ─────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/cobbler/profile/shop:
 *   put:
 *     summary: Update shop details
 *     description: Update the cobbler's shop name and shop address.
 *     tags: [Cobbler Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               shopName:
 *                 type: string
 *                 maxLength: 200
 *                 example: "Raju Shoe Repair"
 *               shopAddress:
 *                 type: string
 *                 maxLength: 500
 *                 example: "123 Main Street, Connaught Place, Delhi"
 *     responses:
 *       200:
 *         description: Shop details updated successfully
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
 *                   example: "Shop details updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     shopName:
 *                       type: string
 *                       example: "Raju Shoe Repair"
 *                     shopAddress:
 *                       type: string
 *                       example: "123 Main Street, Connaught Place, Delhi"
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found
 */
router.put('/shop', updateShopValidation, cobblerProfileController.updateShopDetails);

// ─────────────────────────────────────────────────────────────
// 5. Update Services
// ─────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/cobbler/profile/services:
 *   put:
 *     summary: Update services
 *     description: Update the cobbler's services offered and service areas. Both fields accept arrays of strings.
 *     tags: [Cobbler Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               servicesOffered:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["shoe repair", "polish", "sole replacement", "stitching"]
 *               serviceAreas:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Connaught Place", "Karol Bagh", "Rajouri Garden"]
 *     responses:
 *       200:
 *         description: Services updated successfully
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
 *                   example: "Services updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     servicesOffered:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["shoe repair", "polish", "sole replacement", "stitching"]
 *                     serviceAreas:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Connaught Place", "Karol Bagh", "Rajouri Garden"]
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found
 */
router.put('/services', updateServicesValidation, cobblerProfileController.updateServices);

// ─────────────────────────────────────────────────────────────
// 6. Update Tools Owned
// ─────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/cobbler/profile/tools-owned:
 *   put:
 *     summary: Update tools owned
 *     description: Update the list of tools owned by the cobbler. Replaces the entire array.
 *     tags: [Cobbler Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [toolsOwned]
 *             properties:
 *               toolsOwned:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["hammer", "needle", "thread", "adhesive", "knife"]
 *     responses:
 *       200:
 *         description: Tools owned updated successfully
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
 *                   example: "Tools owned updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     toolsOwned:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["hammer", "needle", "thread", "adhesive", "knife"]
 *       400:
 *         description: toolsOwned must be an array
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found
 */
router.put('/tools-owned', updateToolsValidation, cobblerProfileController.updateToolsOwned);

// ─────────────────────────────────────────────────────────────
// 7. Update Tools Needed
// ─────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/cobbler/profile/tools-needed:
 *   put:
 *     summary: Update tools needed
 *     description: Update the list of tools needed by the cobbler. Replaces the entire array.
 *     tags: [Cobbler Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [toolsNeeded]
 *             properties:
 *               toolsNeeded:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["shoe stretcher", "edge trimmer", "leather cutter"]
 *     responses:
 *       200:
 *         description: Tools needed updated successfully
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
 *                   example: "Tools needed updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     toolsNeeded:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["shoe stretcher", "edge trimmer", "leather cutter"]
 *       400:
 *         description: toolsNeeded must be an array
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found
 */
router.put('/tools-needed', updateToolsNeededValidation, cobblerProfileController.updateToolsNeeded);

// ─────────────────────────────────────────────────────────────
// 8. Upload Profile Image (Cloudinary)
// ─────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/cobbler/profile/upload-image:
 *   post:
 *     summary: Upload profile image
 *     description: |
 *       Upload a profile image for the cobbler.
 *       Image is uploaded to **Cloudinary** (`getmypair/profiles` folder).
 *       If a previous image exists, it is automatically deleted from Cloudinary.
 *       **Allowed types:** JPEG, JPG, PNG, WEBP — **Max size:** 5MB.
 *       Images are auto-optimized to max 500×500px.
 *     tags: [Cobbler Profile]
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
 *                       example: "https://res.cloudinary.com/xxx/image/upload/v1/getmypair/profiles/cobbler-664a1b2c-1708700000.jpg"
 *                     cloudinaryId:
 *                       type: string
 *                       example: "getmypair/profiles/cobbler-664a1b2c-1708700000"
 *       400:
 *         description: No file uploaded or invalid file type
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found — create profile first
 */
router.post('/upload-image', uploadProfileImage, cobblerProfileController.uploadProfileImage);

// ─────────────────────────────────────────────────────────────
// 9. Upload KYC Document (Cloudinary)
// ─────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/cobbler/profile/upload-doc:
 *   post:
 *     summary: Upload KYC document
 *     description: |
 *       Upload a KYC document for verification.
 *       Document is uploaded to **Cloudinary** (`getmypair/kyc` folder).
 *       Multiple KYC documents can be uploaded. Supports images and PDF.
 *       **Allowed types:** JPEG, JPG, PNG, WEBP, PDF — **Max size:** 10MB.
 *     tags: [Cobbler Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file, docType]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: KYC document file (JPEG/PNG/WEBP/PDF, max 10MB)
 *               docType:
 *                 type: string
 *                 enum: [aadhaar, pan, voter_id, driving_license, other]
 *                 description: Type of KYC document
 *                 example: "aadhaar"
 *     responses:
 *       201:
 *         description: KYC document uploaded to Cloudinary successfully
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
 *                   example: "KYC document uploaded successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     document:
 *                       $ref: '#/components/schemas/KycDocument'
 *                     cloudinaryId:
 *                       type: string
 *                       example: "getmypair/kyc/kyc-664a1b2c-aadhaar-1708700000"
 *                     totalDocs:
 *                       type: integer
 *                       example: 2
 *       400:
 *         description: No file uploaded, invalid file type, or missing docType
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found — create profile first
 */
router.post('/upload-doc', uploadKycDoc, cobblerProfileController.uploadKycDoc);

// ─────────────────────────────────────────────────────────────
// 10. Get Verification Status
// ─────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/cobbler/profile/verification:
 *   get:
 *     summary: Get verification status
 *     description: Get the cobbler's current verification status and list of uploaded KYC documents.
 *     tags: [Cobbler Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Verification status retrieved successfully
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
 *                   example: "Verification status retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     verificationStatus:
 *                       type: string
 *                       enum: [pending, verified, rejected]
 *                       example: "pending"
 *                     kycDocsCount:
 *                       type: integer
 *                       example: 2
 *                     kycDocs:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/KycDocument'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found
 */
router.get('/verification', cobblerProfileController.getVerificationStatus);

module.exports = router;
