/**
 * Centralized Swagger path definitions – Delivery Profile
 * All API path docs live under server/src/docs/ – do not add @swagger in route files.
 */

/**
 * @swagger
 * tags:
 *   name: Delivery Profile
 *   description: Delivery partner profile management APIs
 */
void 0;

/**
 * @swagger
 * /api/delivery/profile/create:
 *   post:
 *     summary: Create delivery profile
 *     description: Create a new delivery partner profile
 *     tags: [Delivery Profile]
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
 *                 example: "Suresh Kumar"
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *     responses:
 *       201:
 *         description: Profile created successfully
 *       409:
 *         description: Profile already exists
 */
void 0;

/**
 * @swagger
 * /api/delivery/profile/me:
 *   get:
 *     summary: Get own delivery profile
 *     description: Get the authenticated delivery partner's profile
 *     tags: [Delivery Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *       404:
 *         description: Profile not found
 */
void 0;

/**
 * @swagger
 * /api/delivery/profile/update:
 *   put:
 *     summary: Update delivery profile
 *     description: Update basic profile info (name, phone)
 *     tags: [Delivery Profile]
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
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
void 0;

/**
 * @swagger
 * /api/delivery/profile/vehicle:
 *   put:
 *     summary: Update vehicle details
 *     description: Update delivery partner's vehicle type and number
 *     tags: [Delivery Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               vehicleType:
 *                 type: string
 *                 enum: [bicycle, bike, scooter, auto, car, van, other]
 *                 example: "bike"
 *               vehicleNumber:
 *                 type: string
 *                 example: "DL01AB1234"
 *     responses:
 *       200:
 *         description: Vehicle details updated successfully
 */
void 0;

/**
 * @swagger
 * /api/delivery/profile/upload-doc:
 *   post:
 *     summary: Upload document
 *     description: Upload a document for verification (Aadhaar, PAN, DL, RC, Insurance)
 *     tags: [Delivery Profile]
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
 *               docType:
 *                 type: string
 *                 enum: [aadhaar, pan, driving_license, vehicle_rc, insurance, other]
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 */
void 0;

/**
 * @swagger
 * /api/delivery/profile/upload-image:
 *   post:
 *     summary: Upload profile image
 *     description: Upload a profile image for the delivery partner
 *     tags: [Delivery Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 */
void 0;

/**
 * @swagger
 * /api/delivery/profile/verification:
 *   get:
 *     summary: Get verification status
 *     description: Get the delivery partner's verification status and documents
 *     tags: [Delivery Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Verification status retrieved successfully
 */
void 0;
