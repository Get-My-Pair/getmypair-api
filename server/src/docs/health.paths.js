/**
 * Centralized Swagger path definitions – Health
 * All API path docs live under server/src/docs/ – do not add @swagger in route files.
 */

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Check if the server is running and healthy
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Server is running"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 */
void 0;

/**
 * @swagger
 * /api/version:
 *   get:
 *     summary: Get API version
 *     description: Returns the current API version for Flutter app display or update checks
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API version info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 name:
 *                   type: string
 *                   example: "getmypair-api"
 */
void 0;
