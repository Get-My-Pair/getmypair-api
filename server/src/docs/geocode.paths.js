/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : geocode.paths.js
 * Description: Swagger path definitions – Geocoding (reverse lookup)
 * ----------------------------------------------------------------------------
 */

/**
 * @swagger
 * tags:
 *   name: Geocoding
 *   description: Reverse geocoding (lat/lng to address) via OpenStreetMap Nominatim
 */
void 0;

/**
 * @swagger
 * /api/geocode/reverse:
 *   get:
 *     summary: Reverse geocode coordinates
 *     description: |
 *       Converts latitude and longitude into a structured address using Nominatim.
 *       Public endpoint — no authentication required.
 *     tags: [Geocoding]
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *           format: double
 *         description: Latitude
 *         example: 12.9716
 *       - in: query
 *         name: lon
 *         required: true
 *         schema:
 *           type: number
 *           format: double
 *         description: Longitude
 *         example: 77.5946
 *     responses:
 *       200:
 *         description: Location retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Location retrieved successfully" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     location:
 *                       $ref: '#/components/schemas/GeocodeLocation'
 *       400:
 *         description: Missing or invalid lat/lon
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Geocoding provider error
 */
void 0;

module.exports = {};
