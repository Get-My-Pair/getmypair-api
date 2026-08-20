/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : darkworkstore.paths.js
 * Description: Swagger path definitions – Darkworkstore Dashboard APIs
 * ----------------------------------------------------------------------------
 */

/**
 * @swagger
 * tags:
 *   name: Darkworkstore Auth
 *   description: Darkworkstore login (master-admin JWT)
 */
void 0;

/**
 * @swagger
 * tags:
 *   name: Darkworkstore Payments
 *   description: Payment workflow — cost approval through settlements and reports
 */
void 0;

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
 *   name: Darkworkstore Auth
 *   description: Masteradmin dashboard APIs (React client). Separate from Retailer / mobile ADMIN APIs.
 */
void 0;

/**
 * @swagger
 * /api/darkworkstore/auth/register:
 *   post:
 *     summary: Register a Darkworkstore account
 *     description: Public signup. Sends a thank-you email. Login is blocked until Masteradmin verifies the store.
 *     tags: [Darkworkstore Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, phone, storeName]
 *             properties:
 *               name: { type: string, example: "Priya Store" }
 *               email: { type: string, example: "store@example.com" }
 *               phone: { type: string, example: "9876543210" }
 *               storeName: { type: string, example: "Anna Nagar Workshop" }
 *               address: { type: string }
 *               city: { type: string }
 *               state: { type: string }
 *               pincode: { type: string }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: Registration received — pending verification
 *       409:
 *         description: Email already registered
 */
void 0;

/**
 * @swagger
 * /api/darkworkstore/auth/login:
 *   post:
 *     summary: Dark Work Store login (password; email OTP once)
 *     description: First login sends an email OTP. After that, email and password are enough.
 *     tags: [Darkworkstore Auth]
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
 *         description: Login successful, or OTP sent on first login — complete with /auth/verify-otp
 *       401:
 *         description: Invalid email or password
 */
void 0;

/**
 * @swagger
 * /api/darkworkstore/auth/verify-otp:
 *   post:
 *     summary: Verify one-time email OTP and issue Dark Work Store JWT
 *     tags: [Darkworkstore Auth]
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
 * /api/darkworkstore/auth/resend-otp:
 *   post:
 *     summary: Resend Dark Work Store login OTP
 *     tags: [Darkworkstore Auth]
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
 * /api/darkworkstore/auth/me:
 *   get:
 *     summary: Get current master admin
 *     tags: [Darkworkstore Auth]
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
 * /api/darkworkstore/payments/cost-approval:
 *   get:
 *     summary: List jobs awaiting cost approval
 *     tags: [Darkworkstore Payments]
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
 * /api/darkworkstore/payments/cost/{serviceRequestId}:
 *   patch:
 *     summary: Set actual cost (admin)
 *     description: Updates `actualCost` on a service request and notifies the user for approval.
 *     tags: [Darkworkstore Payments]
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
 * /api/darkworkstore/payments/status:
 *   get:
 *     summary: List payment statuses
 *     tags: [Darkworkstore Payments]
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
 * /api/darkworkstore/payments/status/{orderId}:
 *   get:
 *     summary: Payment status by order id
 *     tags: [Darkworkstore Payments]
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
 * /api/darkworkstore/payments/jobs/paid:
 *   get:
 *     summary: List paid jobs
 *     tags: [Darkworkstore Payments]
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
 * /api/darkworkstore/payments/jobs/unpaid:
 *   get:
 *     summary: List unpaid jobs
 *     tags: [Darkworkstore Payments]
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
 * /api/darkworkstore/payments/revenue:
 *   get:
 *     summary: Revenue dashboard
 *     tags: [Darkworkstore Payments]
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
 * /api/darkworkstore/payments/transactions:
 *   get:
 *     summary: List payment transactions
 *     tags: [Darkworkstore Payments]
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
 * /api/darkworkstore/payments/transactions/{paymentId}:
 *   get:
 *     summary: Transaction details
 *     tags: [Darkworkstore Payments]
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
 * /api/darkworkstore/payments/history/{serviceRequestId}:
 *   get:
 *     summary: Payment history for service request
 *     tags: [Darkworkstore Payments]
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
 * /api/darkworkstore/payments/settlements:
 *   get:
 *     summary: List settlements
 *     tags: [Darkworkstore Payments]
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
 * /api/darkworkstore/payments/settlements/{settlementId}/process:
 *   post:
 *     summary: Process settlement payout
 *     tags: [Darkworkstore Payments]
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
 * /api/darkworkstore/payments/reports/monthly:
 *   get:
 *     summary: Monthly payment report
 *     tags: [Darkworkstore Payments]
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
 * /api/darkworkstore/payments/notifications:
 *   get:
 *     summary: Payment-related admin notifications
 *     tags: [Darkworkstore Payments]
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
 *   name: Darkworkstore Jobs
 *   description: Inbox of user-app jobs — accept, reject, and assign a store cobbler
 */
void 0;

/**
 * @swagger
 * tags:
 *   name: Darkworkstore Cobblers
 *   description: Internal cobbler employees for this store
 */
void 0;

/**
 * @swagger
 * /api/darkworkstore/jobs:
 *   get:
 *     summary: List jobs for this Darkworkstore
 *     description: inbox = unclaimed user-app jobs. accepted = jobs this store took. all = both.
 *     tags: [Darkworkstore Jobs]
 *     security:
 *       - adminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [inbox, accepted, all], example: inbox }
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 50 }
 *     responses:
 *       200:
 *         description: Jobs list
 *       401:
 *         description: Unauthorized
 */
void 0;

/**
 * @swagger
 * /api/darkworkstore/jobs/{id}/accept:
 *   post:
 *     summary: Accept a user-app job
 *     tags: [Darkworkstore Jobs]
 *     security:
 *       - adminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Job accepted — assign a cobbler next
 *       401:
 *         description: Unauthorized
 */
void 0;

/**
 * @swagger
 * /api/darkworkstore/jobs/{id}/reject:
 *   post:
 *     summary: Reject a user-app job
 *     tags: [Darkworkstore Jobs]
 *     security:
 *       - adminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string }
 *     responses:
 *       200:
 *         description: Job rejected for this store
 *       401:
 *         description: Unauthorized
 */
void 0;

/**
 * @swagger
 * /api/darkworkstore/jobs/{id}/assign-cobbler:
 *   post:
 *     summary: Assign an internal cobbler to an accepted job
 *     tags: [Darkworkstore Jobs]
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
 *             required: [cobblerId]
 *             properties:
 *               cobblerId: { type: string, description: Cobbler User _id }
 *     responses:
 *       200:
 *         description: Cobbler assigned
 *       401:
 *         description: Unauthorized
 */
void 0;

/**
 * @swagger
 * /api/darkworkstore/cobblers:
 *   get:
 *     summary: List this store's cobbler employees
 *     tags: [Darkworkstore Cobblers]
 *     security:
 *       - adminBearerAuth: []
 *     responses:
 *       200:
 *         description: Cobblers list
 *       401:
 *         description: Unauthorized
 *   post:
 *     summary: Add an internal cobbler employee
 *     tags: [Darkworkstore Cobblers]
 *     security:
 *       - adminBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, phone]
 *             properties:
 *               name: { type: string, example: "Ravi Kumar" }
 *               phone: { type: string, example: "9876543210" }
 *               shopName: { type: string }
 *               shopAddress: { type: string }
 *               gender: { type: string, enum: [male, female, other] }
 *               dateOfBirth: { type: string, format: date }
 *     responses:
 *       201:
 *         description: Cobbler created
 *       409:
 *         description: Mobile already registered
 */
void 0;

/**
 * @swagger
 * /api/darkworkstore/cobblers/{id}:
 *   delete:
 *     summary: Remove a cobbler employee
 *     tags: [Darkworkstore Cobblers]
 *     security:
 *       - adminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Cobbler removed
 *       400:
 *         description: Cobbler has active jobs
 *       401:
 *         description: Unauthorized
 */
void 0;

