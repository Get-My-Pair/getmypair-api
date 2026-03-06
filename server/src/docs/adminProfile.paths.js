/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : adminProfile.paths.js
 * Description: Swagger path definitions – Admin Profile (users, cobblers, delivery, verify, status)
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

/**
 * @swagger
 * tags:
 *   name: Admin Profile
 *   description: Admin management APIs for profiles
 */
void 0;

/**
 * @swagger
 * /api/admin/profile/users:
 *   get:
 *     summary: Get all users
 *     description: Get all user profiles with pagination
 *     tags: [Admin Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: All user profiles retrieved successfully
 */
void 0;

/**
 * @swagger
 * /api/admin/profile/cobblers:
 *   get:
 *     summary: Get all cobblers
 *     description: Get all cobbler profiles with pagination and optional status filter
 *     tags: [Admin Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, verified, rejected]
 *     responses:
 *       200:
 *         description: All cobbler profiles retrieved successfully
 */
void 0;

/**
 * @swagger
 * /api/admin/profile/delivery:
 *   get:
 *     summary: Get all delivery partners
 *     description: Get all delivery profiles with pagination and optional status filter
 *     tags: [Admin Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, verified, rejected]
 *     responses:
 *       200:
 *         description: All delivery profiles retrieved successfully
 */
void 0;

/**
 * @swagger
 * /api/admin/profile/{id}:
 *   get:
 *     summary: Get profile by ID
 *     description: Get any profile (user, cobbler, or delivery) by its profile ID
 *     tags: [Admin Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *       404:
 *         description: Profile not found
 */
void 0;

/**
 * @swagger
 * /api/admin/profile/verify:
 *   put:
 *     summary: Verify profile
 *     description: Update verification status of a cobbler or delivery profile
 *     tags: [Admin Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [profileId, status]
 *             properties:
 *               profileId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [pending, verified, rejected]
 *     responses:
 *       200:
 *         description: Verification status updated successfully
 *       404:
 *         description: Profile not found
 */
void 0;

/**
 * @swagger
 * /api/admin/profile/status:
 *   put:
 *     summary: Activate/Deactivate account
 *     description: Activate or deactivate a user account
 *     tags: [Admin Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, isActive]
 *             properties:
 *               userId:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Account status updated successfully
 *       404:
 *         description: User not found
 */
void 0;
