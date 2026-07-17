/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : userNotification.paths.js
 * Description: Swagger path definitions – User in-app notifications
 * ----------------------------------------------------------------------------
 */

/**
 * @swagger
 * tags:
 *   name: User Notifications
 *   description: In-app notifications for customer users (cost approval, payments, etc.) — Role USER
 */
void 0;

/**
 * @swagger
 * /api/user/notifications:
 *   get:
 *     summary: List notifications
 *     description: |
 *       Returns paginated in-app notifications for the authenticated user.
 *       Includes unread count in the response payload.
 *     tags: [User Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 50 }
 *       - in: query
 *         name: unreadOnly
 *         schema: { type: boolean, default: false }
 *         description: When true, returns only unread notifications
 *     responses:
 *       200:
 *         description: Notifications retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Notifications retrieved" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/UserNotification'
 *                     total: { type: integer, example: 12 }
 *                     unreadCount: { type: integer, example: 3 }
 *                     page: { type: integer, example: 1 }
 *                     limit: { type: integer, example: 50 }
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — requires USER role
 */
void 0;

/**
 * @swagger
 * /api/user/notifications/{id}/read:
 *   patch:
 *     summary: Mark notification as read
 *     description: Sets `readAt` on a notification owned by the authenticated user.
 *     tags: [User Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Notification MongoDB ObjectId
 *         example: "664a1b2c3d4e5f6a7b8c9d30"
 *     responses:
 *       200:
 *         description: Notification marked as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Notification marked as read" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     notification:
 *                       $ref: '#/components/schemas/UserNotification'
 *       400:
 *         description: Invalid notification id
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found
 */
void 0;

module.exports = {};
