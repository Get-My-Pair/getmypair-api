/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : delivery.paths.js
 * Description: Swagger path definitions – Delivery member portal (/api/delivery)
 * ----------------------------------------------------------------------------
 */

/**
 * @swagger
 * tags:
 *   name: Delivery Auth
 *   description: Delivery member dashboard login (email + password, then OTP). No X-App header.
 */
void 0;

/**
 * @swagger
 * tags:
 *   name: Delivery Jobs
 *   description: Pickup and return jobs assigned to the logged-in delivery member
 */
void 0;

/**
 * @swagger
 * /api/delivery/auth/login:
 *   post:
 *     summary: Delivery member login (password; email OTP once)
 *     description: First login sends an email OTP. After that, email and password are enough.
 *     tags: [Delivery Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: "driver@example.com" }
 *               password: { type: string, example: "Admin@123" }
 *     responses:
 *       200:
 *         description: Login successful, or OTP sent on first login — complete with /auth/verify-otp
 *       401:
 *         description: Invalid email or password
 */
void 0;

/**
 * @swagger
 * /api/delivery/auth/verify-otp:
 *   post:
 *     summary: Verify delivery member email OTP and issue JWT
 *     tags: [Delivery Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [challengeToken, otp]
 *             properties:
 *               challengeToken: { type: string }
 *               otp: { type: string, example: "123456" }
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid or expired OTP
 */
void 0;

/**
 * @swagger
 * /api/delivery/auth/resend-otp:
 *   post:
 *     summary: Resend delivery member login OTP
 *     tags: [Delivery Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [challengeToken]
 *             properties:
 *               challengeToken: { type: string }
 *     responses:
 *       200:
 *         description: OTP resent
 *       401:
 *         description: OTP session expired
 */
void 0;

/**
 * @swagger
 * /api/delivery/auth/me:
 *   get:
 *     summary: Get current delivery member
 *     tags: [Delivery Auth]
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
 * /api/delivery/jobs:
 *   get:
 *     summary: List assigned pickup/return jobs
 *     tags: [Delivery Jobs]
 *     security:
 *       - adminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tab
 *         schema: { type: string, enum: [assigned, pickup, return, picked], example: assigned }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *         description: Alias for tab
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Search by order id
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 50 }
 *       - in: query
 *         name: lat
 *         schema: { type: number }
 *       - in: query
 *         name: lng
 *         schema: { type: number }
 *     responses:
 *       200:
 *         description: Jobs list
 *       401:
 *         description: Unauthorized
 */
void 0;

/**
 * @swagger
 * /api/delivery/jobs/{id}:
 *   get:
 *     summary: Get one assigned delivery job
 *     tags: [Delivery Jobs]
 *     security:
 *       - adminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Delivery job
 *       404:
 *         description: Job not found
 */
void 0;

/**
 * @swagger
 * /api/delivery/jobs/{id}/status:
 *   post:
 *     summary: Update pickup or return status
 *     description: |
 *       `action` must be one of `start_pickup`, `picked_up`, `drop_at_store`,
 *       `collect_from_store`, `out_for_delivery`, `delivered`.
 *       `picked_up` and `delivered` require a matching `orderId` or a proof `photo`.
 *     tags: [Delivery Jobs]
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
 *             required: [action]
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [start_pickup, picked_up, drop_at_store, collect_from_store, out_for_delivery, delivered]
 *               orderId: { type: string }
 *               photo: { type: string, description: Image URL or data URI }
 *               lat: { type: number }
 *               lng: { type: number }
 *     responses:
 *       200:
 *         description: Status updated
 *       400:
 *         description: Invalid action or proof missing
 *       404:
 *         description: Job not found
 */
void 0;
