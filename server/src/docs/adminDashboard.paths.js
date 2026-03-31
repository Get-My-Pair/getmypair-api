/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : adminDashboard.paths.js
 * Description: Swagger path definitions – Master Admin HTML Dashboard APIs
 * ----------------------------------------------------------------------------
 */

/**
 * @swagger
 * tags:
 *   name: Master Admin Dashboard
 *   description: Master admin HTML dashboard APIs (separate from mobile ADMIN role APIs).
 */
void 0;

/**
 * @swagger
 * /api/sys-admin/auth/login:
 *   post:
 *     summary: Master admin login
 *     tags: [Master Admin Dashboard]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: "ranjith.c96me@gmail.com" }
 *               password: { type: string, example: "Admin@123" }
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid email or password
 */
void 0;

/**
 * @swagger
 * /api/sys-admin/auth/me:
 *   get:
 *     summary: Get current master admin
 *     tags: [Master Admin Dashboard]
 *     security:
 *       - adminBearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 *       401:
 *         description: Unauthorized
 */
void 0;

/**
 * @swagger
 * /api/sys-admin/dashboard/stats:
 *   get:
 *     summary: Dashboard stats
 *     tags: [Master Admin Dashboard]
 *     security:
 *       - adminBearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats
 *       401:
 *         description: Unauthorized
 */
void 0;

/**
 * @swagger
 * /api/sys-admin/users:
 *   get:
 *     summary: List users
 *     tags: [Master Admin Dashboard]
 *     security:
 *       - adminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 50 }
 *     responses:
 *       200:
 *         description: Users list
 *       401:
 *         description: Unauthorized
 */
void 0;

/**
 * @swagger
 * /api/sys-admin/articles/by-owner:
 *   get:
 *     summary: List article owners summary
 *     tags: [Master Admin Dashboard]
 *     security:
 *       - adminBearerAuth: []
 *     responses:
 *       200:
 *         description: Owners with counts
 *       401:
 *         description: Unauthorized
 */
void 0;

/**
 * @swagger
 * /api/sys-admin/articles:
 *   get:
 *     summary: List articles (optionally filtered by owner)
 *     tags: [Master Admin Dashboard]
 *     security:
 *       - adminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: ownerId
 *         schema: { type: string }
 *         description: Optional owner user id to filter
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 50 }
 *     responses:
 *       200:
 *         description: Articles list
 *       401:
 *         description: Unauthorized
 */
void 0;

/**
 * @swagger
 * /api/sys-admin/service-requests:
 *   get:
 *     summary: List service requests
 *     tags: [Master Admin Dashboard]
 *     security:
 *       - adminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 50 }
 *     responses:
 *       200:
 *         description: Service requests list
 *       401:
 *         description: Unauthorized
 */
void 0;

/**
 * @swagger
 * /api/sys-admin/service-requests/{id}:
 *   get:
 *     summary: Get service request detail (admin)
 *     tags: [Master Admin Dashboard]
 *     security:
 *       - adminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Service request detail
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 *   patch:
 *     summary: Patch service request workflow / assignments / costs
 *     tags: [Master Admin Dashboard]
 *     security:
 *       - adminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Send any subset of fields to update.
 *             properties:
 *               trackingState: { type: string, example: "pickup_scheduled" }
 *               status: { type: string, example: "pickup_assigned" }
 *               note: { type: string, example: "Pickup scheduled" }
 *               deliveryPartnerId: { type: string, nullable: true }
 *               cobblerId: { type: string, nullable: true }
 *               darkStoreId: { type: string, nullable: true }
 *               darkStoreName: { type: string, nullable: true }
 *               routingType: { type: string, enum: [dark_store, direct] }
 *               estimatedCost: { type: number, nullable: true, example: 500 }
 *               actualCost: { type: number, nullable: true, example: 650 }
 *     responses:
 *       200:
 *         description: Request updated
 *       400:
 *         description: Validation / blocked by pending user approval
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 *   delete:
 *     summary: Delete service request (hard delete)
 *     tags: [Master Admin Dashboard]
 *     security:
 *       - adminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Deleted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 */
void 0;

/**
 * @swagger
 * /api/sys-admin/cobblers:
 *   get:
 *     summary: List cobbler profiles
 *     tags: [Master Admin Dashboard]
 *     security:
 *       - adminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 50 }
 *     responses:
 *       200:
 *         description: Cobblers list
 *       401:
 *         description: Unauthorized
 */
void 0;

/**
 * @swagger
 * /api/sys-admin/delivery-partners:
 *   get:
 *     summary: List delivery partner profiles
 *     tags: [Master Admin Dashboard]
 *     security:
 *       - adminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 50 }
 *     responses:
 *       200:
 *         description: Delivery partners list
 *       401:
 *         description: Unauthorized
 */
void 0;

