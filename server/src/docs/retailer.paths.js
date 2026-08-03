/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : retailer.paths.js
 * Description: Swagger path definitions – Retailer App APIs (/api/retailer)
 * ----------------------------------------------------------------------------
 */

/**
 * @swagger
 * tags:
 *   name: Retailer Profile
 *   description: Retailer / mobile ADMIN profile management (canonical /api/retailer)
 */
void 0;

/**
 * @swagger
 * /api/retailer/profile/users:
 *   get:
 *     summary: Get all users
 *     tags: [Retailer Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All user profiles retrieved successfully
 */
void 0;

/**
 * @swagger
 * /api/retailer/profile/cobblers:
 *   get:
 *     summary: Get all cobblers
 *     tags: [Retailer Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All cobbler profiles retrieved successfully
 */
void 0;

/**
 * @swagger
 * /api/retailer/profile/delivery:
 *   get:
 *     summary: Get all delivery partners
 *     tags: [Retailer Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All delivery partner profiles retrieved successfully
 */
void 0;

/**
 * @swagger
 * /api/retailer/profile/{id}:
 *   get:
 *     summary: Get profile by id
 *     tags: [Retailer Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 */
void 0;

/**
 * @swagger
 * /api/retailer/profile/verify:
 *   put:
 *     summary: Verify a profile
 *     tags: [Retailer Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile verified
 */
void 0;

/**
 * @swagger
 * /api/retailer/profile/status:
 *   put:
 *     summary: Update account status
 *     tags: [Retailer Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Status updated
 */
void 0;
