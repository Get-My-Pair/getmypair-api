/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : payment.paths.js
 * Description: Swagger path definitions – Payments (Module 5, Zoho workflow)
 * ----------------------------------------------------------------------------
 */

/**
 * @swagger
 * tags:
 *   name: Payment
 *   description: |
 *     Module 5 – Zoho payments, user cost approval, revenue split (80% cobbler / 20% GMP on direct routes),
 *     settlements, refunds, and reporting.
 */

/**
 * @swagger
 * /api/payment/webhook/zoho:
 *   post:
 *     summary: Zoho payment webhook
 *     description: |
 *       Callback from Zoho Payments after checkout. No JWT — verified via `X-Zoho-Webhook-Signature`
 *       (`t=<timestamp>,v=<hex>` HMAC of `timestamp.rawBody`) when `ZOHO_WEBHOOK_SECRET` is set.
 *       Accepts Zoho event envelopes (`event_type` + `event_object`) and updates payment / service request state.
 *     tags: [Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reference_id:
 *                 type: string
 *                 description: GMP order id (e.g. GMP-xxxxxxxx-1730000000000)
 *                 example: "GMP-c9d99-1730000000000"
 *               status:
 *                 type: string
 *                 enum: [paid, success, captured, completed, failed, pending, initiated]
 *                 example: "paid"
 *               payment_id:
 *                 type: string
 *                 example: "pay_abc123"
 *     responses:
 *       200:
 *         description: Webhook processed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Webhook processed" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     processed: { type: boolean, example: true }
 *                     webhookLogId: { type: string }
 *       401:
 *         description: Invalid webhook signature (production)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/payment/mock-checkout:
 *   get:
 *     summary: Mock checkout (development)
 *     description: |
 *       Simulates a successful Zoho payment when `ZOHO_PAYMENTS_MOCK=true`. Open the URL returned from
 *       `POST /api/payment/link` in a browser. No authentication required.
 *     tags: [Payment]
 *     parameters:
 *       - in: query
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         example: "GMP-c9d99-1730000000000"
 *     responses:
 *       200:
 *         description: HTML page confirming mock payment success
 *       400:
 *         description: Missing orderId
 *       404:
 *         description: Payment not found
 */

/**
 * @swagger
 * /api/payment/callback:
 *   get:
 *     summary: Zoho payment return URL
 *     description: |
 *       Browser redirect target after Zoho checkout completes.
 *       Verifies payment status and redirects the user back to the app. No JWT required.
 *     tags: [Payment]
 *     parameters:
 *       - in: query
 *         name: orderId
 *         schema: { type: string }
 *         description: GMP order id
 *       - in: query
 *         name: reference_id
 *         schema: { type: string }
 *         description: Alternate order id parameter from Zoho
 *     responses:
 *       302:
 *         description: Redirect to app success/failure page
 *       400:
 *         description: Missing order reference
 */

/**
 * @swagger
 * /api/payment/order:
 *   post:
 *     summary: Create payment order
 *     description: |
 *       Creates a pending payment record for a service request after the user has accepted the final `actualCost`.
 *       Idempotent while a pending/initiated payment exists for the same request.
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentServiceRequestBody'
 *     responses:
 *       200:
 *         description: Payment order created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Payment order created" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     payment:
 *                       $ref: '#/components/schemas/Payment'
 *                     zohoOrder:
 *                       type: object
 *                       description: Raw or mock Zoho order response
 *       400:
 *         description: Cost not accepted, already paid, or invalid amount
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — requires USER role
 *       404:
 *         description: Service request not found
 */

/**
 * @swagger
 * /api/payment/link:
 *   post:
 *     summary: Create Zoho payment link (Pay now)
 *     description: |
 *       Generates a Zoho checkout URL for UPI / card / net banking. Sets payment status to `PAYMENT_INITIATED`
 *       and `paymentState` on the service request accordingly. User must have accepted final cost first.
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/PaymentServiceRequestBody'
 *               - type: object
 *                 properties:
 *                   redirectUrl:
 *                     type: string
 *                     format: uri
 *                     description: Optional post-payment redirect URL
 *                     example: "https://app.getmypair.com/payment/callback"
 *     responses:
 *       200:
 *         description: Payment link generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Payment link generated" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     payment:
 *                       $ref: '#/components/schemas/Payment'
 *                     paymentLink:
 *                       type: object
 *                       properties:
 *                         url: { type: string, format: uri, example: "http://localhost:3000/api/payment/mock-checkout?orderId=GMP-..." }
 *                         payment_link_id: { type: string }
 *                         expires_at: { type: string, format: date-time }
 *       400:
 *         description: Validation or business rule error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — requires USER role
 */

/**
 * @swagger
 * /api/payment/verify:
 *   post:
 *     summary: Verify payment status
 *     description: |
 *       Polls Zoho (or mock) for payment completion by `orderId`. On success, runs the same handler as the webhook:
 *       marks payment `PAYMENT_SUCCESS`, records commission/settlement, and schedules pickup on the service request.
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId]
 *             properties:
 *               orderId:
 *                 type: string
 *                 example: "GMP-c9d99-1730000000000"
 *     responses:
 *       200:
 *         description: Verification completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Payment verification completed" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     payment:
 *                       $ref: '#/components/schemas/Payment'
 *                     verified: { type: boolean, example: true }
 *                     request:
 *                       $ref: '#/components/schemas/ServiceRequest'
 *       404:
 *         description: Payment not found
 */

/**
 * @swagger
 * /api/payment/cost/approve:
 *   post:
 *     summary: User approves final service cost
 *     description: |
 *       Alternative to `POST /api/service/respond-actual-cost` with `decision: accept`.
 *       Sets `actualCostUserDecision` to accepted and moves workflow to payment pending so the user can pay.
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentServiceRequestBody'
 *     responses:
 *       200:
 *         description: Cost approved — proceed to payment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Service cost approved — proceed to payment" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     request:
 *                       $ref: '#/components/schemas/ServiceRequest'
 *                     alreadyAccepted: { type: boolean, example: false }
 *       400:
 *         description: No pending cost approval
 *       404:
 *         description: Service request not found
 */

/**
 * @swagger
 * /api/payment/cost/reject:
 *   post:
 *     summary: User rejects final service cost
 *     description: Cancels the service request when the user rejects the cobbler/dark store quoted `actualCost`.
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/PaymentServiceRequestBody'
 *               - type: object
 *                 properties:
 *                   reason:
 *                     type: string
 *                     maxLength: 500
 *                     example: "Quoted price is too high"
 *     responses:
 *       200:
 *         description: Cost rejected — request cancelled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     request:
 *                       $ref: '#/components/schemas/ServiceRequest'
 */

/**
 * @swagger
 * /api/payment/history:
 *   get:
 *     summary: User payment history
 *     description: Paginated list of payment transactions for the authenticated user (newest first).
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
 *     responses:
 *       200:
 *         description: Payment history retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Payment history retrieved" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Payment'
 *                     total: { type: integer, example: 12 }
 *                     page: { type: integer, example: 1 }
 *                     limit: { type: integer, example: 20 }
 */

/**
 * @swagger
 * /api/payment/status/{orderId}:
 *   get:
 *     summary: Payment status by order id
 *     description: Returns payment status for a GMP order id (e.g. `GMP-c9d99-1730000000000`).
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
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

/**
 * @swagger
 * /api/payment/by-service-request/{serviceRequestId}:
 *   get:
 *     summary: Payment by service request
 *     description: Returns the active or most recent payment linked to a service request.
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceRequestId
 *         required: true
 *         schema: { type: string }
 *         example: "664a1b2c3d4e5f6a7b8c9d99"
 *     responses:
 *       200:
 *         description: Payment retrieved
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Payment not found
 */

/**
 * @swagger
 * /api/payment/{paymentId}:
 *   get:
 *     summary: Payment details
 *     description: |
 *       Returns a payment by MongoDB `_id` or by `orderId` (e.g. `GMP-...`). Users may only access their own payments;
 *       ADMIN may access any.
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ObjectId or GMP order id
 *         example: "664a1b2c3d4e5f6a7b8c9d01"
 *     responses:
 *       200:
 *         description: Payment details retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     payment:
 *                       $ref: '#/components/schemas/Payment'
 *       404:
 *         description: Payment not found
 */

/**
 * @swagger
 * /api/payment/cobbler/earnings:
 *   get:
 *     summary: Cobbler earnings
 *     description: |
 *       Aggregates successful payments where `cobblerShare` applies (80% on direct cobbler routes).
 *       Includes recent settlement records for the authenticated cobbler.
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *         description: Filter `paidAt` from (ISO 8601)
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 *         description: Filter `paidAt` to (ISO 8601)
 *     responses:
 *       200:
 *         description: Cobbler earnings retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalEarnings: { type: number, example: 2400 }
 *                         totalTransactions: { type: integer, example: 3 }
 *                         totalGross: { type: number, example: 3000 }
 *                     settlements:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Settlement'
 *       403:
 *         description: Forbidden — requires COBBER role
 */

/**
 * @swagger
 * /api/payment/darkstore/{darkStoreId}/revenue:
 *   get:
 *     summary: Dark store revenue
 *     description: Revenue from completed payments routed through a dark store (providerType dark_store).
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: darkStoreId
 *         required: true
 *         schema: { type: string }
 *         example: "STORE_21"
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Dark store revenue retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     revenue:
 *                       type: object
 *                       properties:
 *                         totalRevenue: { type: number, example: 15000 }
 *                         transactionCount: { type: integer, example: 10 }
 */

/**
 * @swagger
 * /api/payment/settlement/process:
 *   post:
 *     summary: Process settlement payout
 *     description: Marks a pending settlement as completed (manual or ops-triggered payout).
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [settlementId]
 *             properties:
 *               settlementId:
 *                 type: string
 *                 example: "664a1b2c3d4e5f6a7b8c9d02"
 *     responses:
 *       200:
 *         description: Settlement processed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     settlement:
 *                       $ref: '#/components/schemas/Settlement'
 *       403:
 *         description: Forbidden — requires ADMIN role
 *       404:
 *         description: Settlement not found
 */

/**
 * @swagger
 * /api/payment/refund:
 *   post:
 *     summary: Request refund
 *     description: Initiates a refund for a successful payment. Sets payment status to `PAYMENT_REFUNDED`.
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [paymentId]
 *             properties:
 *               paymentId:
 *                 type: string
 *                 example: "664a1b2c3d4e5f6a7b8c9d01"
 *               reason:
 *                 type: string
 *                 example: "Service cancelled before pickup"
 *               amount:
 *                 type: number
 *                 minimum: 0
 *                 description: Partial refund amount; defaults to full payment amount
 *     responses:
 *       200:
 *         description: Refund initiated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     refund:
 *                       $ref: '#/components/schemas/Refund'
 *                     payment:
 *                       $ref: '#/components/schemas/Payment'
 */

/**
 * @swagger
 * /api/payment/admin/report:
 *   get:
 *     summary: Payment report (admin)
 *     description: Aggregated successful payments grouped by day, week, or month.
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *           default: day
 *     responses:
 *       200:
 *         description: Payment report generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     byPeriod:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id: { type: string, example: "2026-06-04" }
 *                           gross: { type: number, example: 5000 }
 *                           gmp: { type: number, example: 1000 }
 *                           partner: { type: number, example: 4000 }
 *                           count: { type: integer, example: 5 }
 *                     totals:
 *                       type: object
 *                       properties:
 *                         gross: { type: number }
 *                         gmp: { type: number }
 *                         partner: { type: number }
 *                         count: { type: integer }
 *       403:
 *         description: Forbidden — requires ADMIN role
 */

/**
 * @swagger
 * /api/payment/admin/commission-preview:
 *   get:
 *     summary: Preview revenue split
 *     description: |
 *       Calculates GMP vs partner share without creating a payment.
 *       Cobbler direct route uses 80% / 20%; dark store keeps 100% to partner; GMP escalation keeps 100% to GMP.
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: amount
 *         required: true
 *         schema: { type: number, minimum: 0 }
 *         example: 1000
 *       - in: query
 *         name: providerType
 *         schema:
 *           type: string
 *           enum: [cobbler, dark_store, gmp]
 *           default: cobbler
 *     responses:
 *       200:
 *         description: Commission split calculated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     split:
 *                       $ref: '#/components/schemas/RevenueSplit'
 */

module.exports = {};
