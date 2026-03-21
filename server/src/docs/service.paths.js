/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : service.paths.js
 * Description: Swagger path definitions – Service Requests (Module 4)
 * ----------------------------------------------------------------------------
 */

/**
 * @swagger
 * tags:
 *   name: Service Requests
 *   description: Module 4 service request APIs (User + system assignment flows)
 */
void 0;

/**
 * @swagger
 * /api/service/create:
 *   post:
 *     summary: Create service request
 *     description: |
 *       Create a new service request for the authenticated user.
 *       Article ownership and address ownership are validated on backend.
 *     tags: [Service Requests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [articleId, serviceType, addressId]
 *             properties:
 *               articleId:
 *                 type: string
 *                 example: "664a1b2c3d4e5f6a7b8c9d20"
 *               serviceType:
 *                 type: string
 *                 enum: [repair, maintenance, wash, donate, dispose]
 *                 example: "repair"
 *               addressId:
 *                 type: string
 *                 example: "664a1b2c3d4e5f6a7b8c9d10"
 *               photos:
 *                 type: array
 *                 items: { type: string }
 *               videos:
 *                 type: array
 *                 items: { type: string }
 *               estimatedCost:
 *                 type: number
 *                 minimum: 0
 *                 example: 500
 *               actualCost:
 *                 type: number
 *                 minimum: 0
 *                 example: 650
 *     responses:
 *       201:
 *         description: Service request created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Service request created successfully" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     request:
 *                       $ref: '#/components/schemas/ServiceRequest'
 *       400:
 *         description: Validation error / invalid address mapping
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden — requires USER role
 */
void 0;

/**
 * @swagger
 * /api/service/my:
 *   get:
 *     summary: Get my service requests
 *     description: Returns all service requests for authenticated user (newest first).
 *     tags: [Service Requests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Service requests retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Service requests retrieved successfully" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     requests:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ServiceRequest'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — requires USER role
 */
void 0;

/**
 * @swagger
 * /api/service/estimation-defaults:
 *   get:
 *     summary: Get estimation defaults by service type
 *     description: Returns default estimated cost per serviceType for auto-fill in mobile app.
 *     tags: [Service Requests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estimation defaults retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Estimation defaults by service type" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     estimationDefaults:
 *                       type: object
 *                       properties:
 *                         repair: { type: number, example: 500 }
 *                         maintenance: { type: number, example: 300 }
 *                         wash: { type: number, example: 200 }
 *                         donate: { type: number, example: 0 }
 *                         dispose: { type: number, example: 0 }
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — requires USER role
 */
void 0;

/**
 * @swagger
 * /api/service/{requestId}:
 *   get:
 *     summary: Get service request details
 *     description: Returns full service request details including timeline/lifecycle events.
 *     tags: [Service Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *         example: "664a1b2c3d4e5f6a7b8c9d99"
 *     responses:
 *       200:
 *         description: Service request details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Service request not found
 */
void 0;

/**
 * @swagger
 * /api/service/update-status:
 *   post:
 *     summary: Update service request status and timeline
 *     description: |
 *       System-side API to update service lifecycle status.
 *       Can optionally assign a verified cobbler and attach media evidence.
 *     tags: [Service Requests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [requestId, status]
 *             properties:
 *               requestId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [pending, pickup_assigned, in_service, completed, cancelled]
 *               state:
 *                 type: string
 *                 example: "inspection_completed"
 *               note:
 *                 type: string
 *                 example: "Inspection completed with minor stitching needed"
 *               cobblerId:
 *                 type: string
 *                 description: Optional verified cobbler user id
 *               photos:
 *                 type: array
 *                 items: { type: string }
 *               videos:
 *                 type: array
 *                 items: { type: string }
 *     responses:
 *       200:
 *         description: Service status updated successfully
 *       400:
 *         description: Validation error or invalid request state
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — requires ADMIN or COBBER role
 *       404:
 *         description: Service request or cobbler not found
 */
void 0;

/**
 * @swagger
 * /api/service/assign-delivery:
 *   post:
 *     summary: Assign delivery partner
 *     description: |
 *       System/Admin/Cobbler API.
 *       Assigns a verified delivery partner to service request.
 *       If `deliveryPartnerId` is omitted, backend auto-picks a verified partner.
 *     tags: [Service Requests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [requestId]
 *             properties:
 *               requestId:
 *                 type: string
 *                 example: "664a1b2c3d4e5f6a7b8c9d99"
 *               deliveryPartnerId:
 *                 type: string
 *                 description: Optional userId of verified delivery partner
 *                 example: "664a1b2c3d4e5f6a7b8c9d77"
 *     responses:
 *       200:
 *         description: Delivery partner assigned successfully
 *       400:
 *         description: Invalid request state
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — requires ADMIN or COBBER role
 */
void 0;

/**
 * @swagger
 * /api/service/assign-darkstore:
 *   post:
 *     summary: Assign dark store
 *     description: |
 *       System/Admin/Cobbler API.
 *       Assigns dark store details to service request and updates tracking state.
 *     tags: [Service Requests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [requestId, darkStoreId]
 *             properties:
 *               requestId:
 *                 type: string
 *                 example: "664a1b2c3d4e5f6a7b8c9d99"
 *               darkStoreId:
 *                 type: string
 *                 example: "STORE_21"
 *               darkStoreName:
 *                 type: string
 *                 example: "Dark Store - T Nagar"
 *               routingType:
 *                 type: string
 *                 enum: [dark_store, direct]
 *                 example: "dark_store"
 *     responses:
 *       200:
 *         description: Dark store assigned successfully
 *       400:
 *         description: Validation error / invalid request state
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — requires ADMIN or COBBER role
 */
void 0;

