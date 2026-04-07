/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : cobblerHome.paths.js
 * Description: Swagger path definitions – Cobbler Home Dashboard
 * ----------------------------------------------------------------------------
 */

/**
 * @swagger
 * /api/cobbler/home/dashboard:
 *   get:
 *     summary: Get cobbler dashboard
 *     description: |
 *       Returns cobbler home dashboard summary including:
 *       profile flags, earnings totals, and job counters.
 *       `jobs.newRequests` matches available requests visible to this cobbler.
 *     tags: [Cobbler Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Dashboard retrieved successfully" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     profileComplete: { type: boolean, example: true }
 *                     profile:
 *                       type: object
 *                       properties:
 *                         name: { type: string, example: "Ranjith" }
 *                         profileImage: { type: string, nullable: true }
 *                         verificationStatus: { type: string, enum: [pending, verified, rejected] }
 *                         isOnline: { type: boolean, example: true }
 *                     earnings:
 *                       type: object
 *                       properties:
 *                         today: { type: number, example: 0 }
 *                         weekly: { type: number, example: 0 }
 *                         total: { type: number, example: 0 }
 *                     jobs:
 *                       type: object
 *                       properties:
 *                         newRequests: { type: integer, example: 3 }
 *                         active: { type: integer, example: 1 }
 *                         completed: { type: integer, example: 10 }
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — requires COBBER role
 */
void 0;

