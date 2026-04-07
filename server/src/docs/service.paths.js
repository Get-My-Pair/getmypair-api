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
 *     description: |
 *       Returns service request details.
 *       Response includes `request` plus enriched `article`, `user`, resolved `pickupAddress`, and `media`.
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Service request details retrieved successfully" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     request:
 *                       $ref: '#/components/schemas/ServiceRequest'
 *                     article:
 *                       $ref: '#/components/schemas/Article'
 *                     user:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         _id: { type: string }
 *                         name: { type: string }
 *                         mobile: { type: string }
 *                     pickupAddress:
 *                       allOf:
 *                         - $ref: '#/components/schemas/Address'
 *                       nullable: true
 *                     media:
 *                       type: object
 *                       properties:
 *                         photos:
 *                           type: array
 *                           items: { type: string, format: uri }
 *                         videos:
 *                           type: array
 *                           items: { type: string, format: uri }
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
 * /api/service/cobbler/new-requests:
 *   get:
 *     summary: List available new requests for cobbler
 *     description: |
 *       Returns pending unassigned requests visible to authenticated cobbler.
 *       Requests previously rejected by this cobbler are excluded.
 *     tags: [Service Requests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: New requests retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "New requests retrieved successfully" }
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
 *         description: Forbidden — requires COBBER role
 */
void 0;

/**
 * @swagger
 * /api/service/cobbler/active:
 *   get:
 *     summary: List active requests assigned to cobbler
 *     tags: [Service Requests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active requests retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Active requests retrieved successfully" }
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
 *         description: Forbidden — requires COBBER role
 */
void 0;

/**
 * @swagger
 * /api/service/cobbler/accept:
 *   post:
 *     summary: Cobbler accepts a request
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
 *               requestId: { type: string, example: "664a1b2c3d4e5f6a7b8c9d99" }
 *     responses:
 *       200:
 *         description: Request accepted successfully
 *       400:
 *         description: Invalid request state/already assigned
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — requires verified COBBER
 */
void 0;

/**
 * @swagger
 * /api/service/cobbler/reject:
 *   post:
 *     summary: Cobbler rejects a request
 *     description: |
 *       Marks this request as declined by current cobbler.
 *       Request is not cancelled globally; other cobblers can still accept it.
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
 *               requestId: { type: string, example: "664a1b2c3d4e5f6a7b8c9d99" }
 *               reason: { type: string, example: "Too far from my location" }
 *     responses:
 *       200:
 *         description: Request rejected successfully
 *       400:
 *         description: Invalid request state
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — requires COBBER role
 */
void 0;

/**
 * @swagger
 * /api/service/cobbler/set-actual-cost:
 *   post:
 *     summary: Cobbler sets final actual cost
 *     description: Sets final cost and marks user decision as pending.
 *     tags: [Service Requests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [requestId, actualCost]
 *             properties:
 *               requestId: { type: string, example: "664a1b2c3d4e5f6a7b8c9d99" }
 *               actualCost: { type: number, minimum: 0, example: 650 }
 *     responses:
 *       200:
 *         description: Actual cost set successfully
 *       400:
 *         description: Invalid request state or invalid amount
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — only assigned COBBER can set cost
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
 * /api/service/cancel/{requestId}:
 *   put:
 *     summary: Cancel service request
 *     tags: [Service Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Service request cancelled successfully
 *       400:
 *         description: Completed request cannot be cancelled
 *       401:
 *         description: Unauthorized
 */
void 0;

/**
 * @swagger
 * /api/service/upload-media:
 *   post:
 *     summary: Upload service media evidence
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
 *               requestId: { type: string }
 *               state: { type: string, example: "inspection_started" }
 *               note: { type: string }
 *               actorType:
 *                 type: string
 *                 enum: [system, customer, delivery, dark_store, cobbler, admin]
 *               photos:
 *                 type: array
 *                 items: { type: string }
 *               videos:
 *                 type: array
 *                 items: { type: string }
 *     responses:
 *       200:
 *         description: Service media uploaded successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
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

