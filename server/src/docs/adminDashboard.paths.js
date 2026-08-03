/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : adminDashboard.paths.js
 * Description: Swagger path definitions – Masteradmin Dashboard APIs
 * ----------------------------------------------------------------------------
 */

/**
 * @swagger
 * tags:
 *   name: Master Admin Dashboard
 *   description: Masteradmin dashboard APIs (React client). Separate from Retailer / mobile ADMIN APIs.
 */
void 0;

/**
 * @swagger
 * /api/masteradmin/auth/login:
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
 * /api/masteradmin/auth/me:
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
 * /api/masteradmin/dashboard/stats:
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
 * /api/masteradmin/users:
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
 * /api/masteradmin/users/{id}:
 *   delete:
 *     summary: Delete user and owned data
 *     description: |
 *       Hard-deletes a mobile user and cascades removal of owned profiles, articles,
 *       service requests, sessions, and related records.
 *     tags: [Master Admin Dashboard]
 *     security:
 *       - adminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: User MongoDB ObjectId
 *     responses:
 *       200:
 *         description: User deleted
 *       400:
 *         description: Invalid user id
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
void 0;

/**
 * @swagger
 * /api/masteradmin/articles/by-owner:
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
 * /api/masteradmin/articles:
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
 * /api/masteradmin/service-requests:
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
 * /api/masteradmin/service-requests/{id}:
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
 * /api/masteradmin/cobblers:
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
 * /api/masteradmin/cobblers/{id}/verify:
 *   patch:
 *     summary: Update cobbler verification status
 *     tags: [Master Admin Dashboard]
 *     security:
 *       - adminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Cobbler profile MongoDB ObjectId
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, verified, rejected]
 *                 default: verified
 *                 example: "verified"
 *     responses:
 *       200:
 *         description: Verification status updated
 *       400:
 *         description: Invalid status or profile id
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Cobbler profile not found
 */
void 0;

/**
 * @swagger
 * /api/masteradmin/delivery-partners:
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

/**
 * @swagger
 * tags:
 *   name: Master Admin Payments
 *   description: Darkworkstore master admin payment module (HTML dashboard)
 */
void 0;

/**
 * @swagger
 * /api/masteradmin/payments/cost-approval:
 *   get:
 *     summary: List jobs awaiting cost approval
 *     tags: [Master Admin Payments]
 *     security:
 *       - adminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 50 }
 *       - in: query
 *         name: darkStoreId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Cost approval jobs list
 *       401:
 *         description: Unauthorized
 */
void 0;

/**
 * @swagger
 * /api/masteradmin/payments/cost/{serviceRequestId}:
 *   patch:
 *     summary: Set actual cost (admin)
 *     description: Updates `actualCost` on a service request and notifies the user for approval.
 *     tags: [Master Admin Payments]
 *     security:
 *       - adminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceRequestId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [actualCost]
 *             properties:
 *               actualCost:
 *                 type: number
 *                 minimum: 0
 *                 example: 650
 *     responses:
 *       200:
 *         description: Actual cost updated â€” awaiting user approval
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
void 0;

/**
 * @swagger
 * /api/masteradmin/payments/status:
 *   get:
 *     summary: List payment statuses
 *     tags: [Master Admin Payments]
 *     security:
 *       - adminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 50 }
 *       - in: query
 *         name: darkStoreId
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Payment status list
 *       401:
 *         description: Unauthorized
 */
void 0;

/**
 * @swagger
 * /api/masteradmin/payments/status/{orderId}:
 *   get:
 *     summary: Payment status by order id
 *     tags: [Master Admin Payments]
 *     security:
 *       - adminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string }
 *         example: "GMP-c9d99-1730000000000"
 *     responses:
 *       200:
 *         description: Payment status retrieved
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Payment not found
 */
void 0;

/**
 * @swagger
 * /api/masteradmin/payments/jobs/paid:
 *   get:
 *     summary: List paid jobs
 *     tags: [Master Admin Payments]
 *     security:
 *       - adminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 50 }
 *       - in: query
 *         name: darkStoreId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paid jobs list
 *       401:
 *         description: Unauthorized
 */
void 0;

/**
 * @swagger
 * /api/masteradmin/payments/jobs/unpaid:
 *   get:
 *     summary: List unpaid jobs
 *     tags: [Master Admin Payments]
 *     security:
 *       - adminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 50 }
 *       - in: query
 *         name: darkStoreId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Unpaid jobs list
 *       401:
 *         description: Unauthorized
 */
void 0;

/**
 * @swagger
 * /api/masteradmin/payments/revenue:
 *   get:
 *     summary: Revenue dashboard
 *     tags: [Master Admin Payments]
 *     security:
 *       - adminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 50 }
 *       - in: query
 *         name: darkStoreId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Revenue dashboard data
 *       401:
 *         description: Unauthorized
 */
void 0;

/**
 * @swagger
 * /api/masteradmin/payments/transactions:
 *   get:
 *     summary: List payment transactions
 *     tags: [Master Admin Payments]
 *     security:
 *       - adminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 50 }
 *       - in: query
 *         name: darkStoreId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Transactions list
 *       401:
 *         description: Unauthorized
 */
void 0;

/**
 * @swagger
 * /api/masteradmin/payments/transactions/{paymentId}:
 *   get:
 *     summary: Transaction details
 *     tags: [Master Admin Payments]
 *     security:
 *       - adminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Transaction details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Payment not found
 */
void 0;

/**
 * @swagger
 * /api/masteradmin/payments/history/{serviceRequestId}:
 *   get:
 *     summary: Payment history for service request
 *     tags: [Master Admin Payments]
 *     security:
 *       - adminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceRequestId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Service payment history
 *       401:
 *         description: Unauthorized
 */
void 0;

/**
 * @swagger
 * /api/masteradmin/payments/settlements:
 *   get:
 *     summary: List settlements
 *     tags: [Master Admin Payments]
 *     security:
 *       - adminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 50 }
 *       - in: query
 *         name: darkStoreId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Settlements list
 *       401:
 *         description: Unauthorized
 */
void 0;

/**
 * @swagger
 * /api/masteradmin/payments/settlements/{settlementId}/process:
 *   post:
 *     summary: Process settlement payout
 *     tags: [Master Admin Payments]
 *     security:
 *       - adminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: settlementId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Settlement processed
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Settlement not found
 */
void 0;

/**
 * @swagger
 * /api/masteradmin/payments/reports/monthly:
 *   get:
 *     summary: Monthly payment report
 *     tags: [Master Admin Payments]
 *     security:
 *       - adminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema: { type: integer, example: 2026 }
 *       - in: query
 *         name: month
 *         schema: { type: integer, minimum: 1, maximum: 12, example: 6 }
 *       - in: query
 *         name: darkStoreId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Monthly report generated
 *       401:
 *         description: Unauthorized
 */
void 0;

/**
 * @swagger
 * /api/masteradmin/payments/notifications:
 *   get:
 *     summary: Payment-related admin notifications
 *     tags: [Master Admin Payments]
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
 *         description: Notifications list
 *       401:
 *         description: Unauthorized
 */
void 0;

/**
 * @swagger
 * tags:
 *   name: Master Admin Database
 *   description: MongoDB maintenance for testing/reset (preserves master admin login)
 */
void 0;

/**
 * @swagger
 * /api/masteradmin/db/overview:
 *   get:
 *     summary: Database overview
 *     description: Returns collection counts and logical delete groups for the maintenance UI.
 *     tags: [Master Admin Database]
 *     security:
 *       - adminBearerAuth: []
 *     responses:
 *       200:
 *         description: Database overview
 *       401:
 *         description: Unauthorized
 */
void 0;

/**
 * @swagger
 * /api/masteradmin/db/clear/collection:
 *   post:
 *     summary: Clear a single collection
 *     description: Deletes all documents in one collection. `adminmasters` is protected.
 *     tags: [Master Admin Database]
 *     security:
 *       - adminBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [collection, confirmPhrase]
 *             properties:
 *               collection:
 *                 type: string
 *                 example: "articles"
 *               confirmPhrase:
 *                 type: string
 *                 description: Confirmation phrase required by the maintenance UI
 *     responses:
 *       200:
 *         description: Collection cleared
 *       400:
 *         description: Validation error or protected collection
 *       401:
 *         description: Unauthorized
 */
void 0;

/**
 * @swagger
 * /api/masteradmin/db/clear/group:
 *   post:
 *     summary: Clear a logical data group
 *     description: Deletes documents across a predefined group (auth, articles, services, payments, etc.).
 *     tags: [Master Admin Database]
 *     security:
 *       - adminBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [group, confirmPhrase]
 *             properties:
 *               group:
 *                 type: string
 *                 enum: [auth, articles, services, cobblers, delivery, payments, notifications, mobileAdmin]
 *                 example: "services"
 *               confirmPhrase:
 *                 type: string
 *     responses:
 *       200:
 *         description: Group cleared
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
void 0;

/**
 * @swagger
 * /api/masteradmin/db/clear/all:
 *   post:
 *     summary: Clear all application data
 *     description: |
 *       Deletes all application data while preserving master admin login credentials (`adminmasters`).
 *     tags: [Master Admin Database]
 *     security:
 *       - adminBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [confirmPhrase]
 *             properties:
 *               confirmPhrase:
 *                 type: string
 *     responses:
 *       200:
 *         description: All application data cleared
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
void 0;

