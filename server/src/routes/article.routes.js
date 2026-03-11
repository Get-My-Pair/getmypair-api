/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : article.routes.js
 * Description: Article (Digital Shoe Passport) – create, my, upload-image (Module 3)
 * ----------------------------------------------------------------------------
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const { uploadArticleImage } = require('../middleware/upload.middleware');
const articleController = require('../controllers/article.controller');
const { createArticleValidation } = require('../validations/article.validation');

router.use(authMiddleware);
router.use(roleMiddleware(['USER']));

router.post('/create', createArticleValidation, articleController.createArticle);
router.get('/my', articleController.getMyArticles);
router.post('/upload-image', uploadArticleImage, articleController.uploadArticleImage);

module.exports = router;
