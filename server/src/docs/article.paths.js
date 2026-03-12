/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : article.paths.js
 * Description: Swagger path definitions – Articles (Module 3 – Digital Shoe Passport)
 * ----------------------------------------------------------------------------
 */

/**
 * @swagger
 * tags:
 *   name: Articles
 *   description: Article management (Digital Shoe Passport) — Role required **USER**
 */
void 0;

/**
 * @swagger
 * /api/articles/create:
 *   post:
 *     summary: Create article (register shoe)
 *     description: |
 *       Register a new shoe (article) for the authenticated user.
 *       Each article is a digital shoe passport. **ownerId** is set from JWT.
 *       Optional fields: color, purchaseYear, materials, condition, images (URLs).
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [brand, model, category]
 *             properties:
 *               brand:
 *                 type: string
 *                 maxLength: 120
 *                 example: "Nike"
 *               model:
 *                 type: string
 *                 maxLength: 120
 *                 example: "Air Max 90"
 *               category:
 *                 type: string
 *                 enum: [sports_shoe, casual, formal, sandal, boot, slipper, other]
 *                 example: "sports_shoe"
 *               color:
 *                 type: string
 *                 maxLength: 60
 *                 example: "black"
 *               purchaseYear:
 *                 type: integer
 *                 minimum: 1900
 *                 maximum: 2100
 *                 example: 2023
 *               condition:
 *                 type: string
 *                 enum: [excellent, good, fair, worn]
 *                 example: "good"
 *               materials:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       example: "rubber"
 *                     percentage:
 *                       type: integer
 *                       minimum: 0
 *                       maximum: 100
 *                       example: 40
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uri
 *                 description: Optional image URLs (use upload-image to add more later)
 *     responses:
 *       201:
 *         description: Article created successfully
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
 *                   example: "Article created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     article:
 *                       $ref: '#/components/schemas/Article'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: Unauthorized — missing or invalid JWT
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden — requires USER role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
void 0;

/**
 * @swagger
 * /api/articles/my:
 *   get:
 *     summary: Get my articles
 *     description: |
 *       Returns all articles (registered shoes) for the authenticated user.
 *       Sorted by **createdAt** descending (newest first).
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of articles retrieved successfully
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
 *                   example: "Articles retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     articles:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Article'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden — requires USER role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
void 0;

/**
 * @swagger
 * /api/articles/upload-image:
 *   post:
 *     summary: Upload article image
 *     description: |
 *       Upload an image for an existing article (shoe).
 *       Image is stored in **Cloudinary** (`getmypair/articles` folder).
 *       **Required:** multipart field **file** (image) and **articleId** (body or query).
 *       **Allowed types:** JPEG, PNG, WEBP, GIF, etc. — **Max:** 5MB.
 *       The new image URL is appended to the article's **images** array.
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Image file (JPEG/PNG/WEBP, max 5MB)
 *               articleId:
 *                 type: string
 *                 description: Article ID to attach the image to (can also be sent as query param)
 *                 example: "664a1b2c3d4e5f6a7b8c9d20"
 *     responses:
 *       200:
 *         description: Image uploaded successfully
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
 *                   example: "Image uploaded successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     imageUrl:
 *                       type: string
 *                       format: uri
 *                       example: "https://res.cloudinary.com/xxx/image/upload/v1/getmypair/articles/article-xxx.jpg"
 *                     articleId:
 *                       type: string
 *                       example: "664a1b2c3d4e5f6a7b8c9d20"
 *                     images:
 *                       type: array
 *                       items:
 *                         type: string
 *                         format: uri
 *                       description: Full list of image URLs for the article
 *       400:
 *         description: No file uploaded, invalid file type, or articleId missing
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden — requires USER role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Article not found (or not owned by user)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
void 0;

/**
 * @swagger
 * /api/articles/{articleId}:
 *   get:
 *     summary: Get article by ID
 *     description: |
 *       Returns a single article (shoe) by ID. **Validates owner** — only the owning user can view.
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: articleId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the article
 *     responses:
 *       200:
 *         description: Article retrieved successfully
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
 *                   example: "Article retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     article:
 *                       $ref: '#/components/schemas/Article'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden — requires USER role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Article not found or not owned by user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
void 0;

/**
 * @swagger
 * /api/articles/update/{articleId}:
 *   put:
 *     summary: Update article
 *     description: |
 *       Update an existing article (shoe). **Validates owner** — only the owning user can update.
 *       All body fields are optional (partial update).
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: articleId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the article
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               brand:
 *                 type: string
 *                 maxLength: 120
 *               model:
 *                 type: string
 *                 maxLength: 120
 *               category:
 *                 type: string
 *                 enum: [sports_shoe, casual, formal, sandal, boot, slipper, other]
 *               color:
 *                 type: string
 *                 maxLength: 60
 *               purchaseYear:
 *                 type: integer
 *                 minimum: 1900
 *                 maximum: 2100
 *               condition:
 *                 type: string
 *                 enum: [excellent, good, fair, worn]
 *               materials:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type: { type: string }
 *                     percentage: { type: integer, minimum: 0, maximum: 100 }
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uri
 *     responses:
 *       200:
 *         description: Article updated successfully
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
 *                   example: "Article updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     article:
 *                       $ref: '#/components/schemas/Article'
 *       400:
 *         description: Validation error
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Article not found or not owned by user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
void 0;

/**
 * @swagger
 * /api/articles/delete/{articleId}:
 *   delete:
 *     summary: Delete article
 *     description: |
 *       Delete an article (shoe) and remove its images from Cloudinary. **Validates owner** — only the owning user can delete.
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: articleId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the article
 *     responses:
 *       200:
 *         description: Article deleted successfully
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
 *                   example: "Article deleted successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     articleId:
 *                       type: string
 *                       example: "664a1b2c3d4e5f6a7b8c9d20"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden — requires USER role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Article not found or not owned by user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
void 0;
