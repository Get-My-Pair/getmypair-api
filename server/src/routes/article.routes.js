/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : article.routes.js
 * Description: Article (Digital Shoe Passport) – create, my, getById, update, delete, upload-image (Module 3)
 * ----------------------------------------------------------------------------
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const { uploadArticleImage } = require('../middleware/upload.middleware');
const articleController = require('../controllers/article.controller');
const { createArticleValidation, updateArticleValidation } = require('../validations/article.validation');

router.use(authMiddleware);
router.use(roleMiddleware(['USER']));

router.post('/create', createArticleValidation, articleController.createArticle);
router.get('/my', articleController.getMyArticles);
router.get('/:articleId', articleController.getArticleById);
router.put('/update/:articleId', updateArticleValidation, articleController.updateArticle);
router.delete('/delete/:articleId', articleController.deleteArticle);
router.post('/upload-image', uploadArticleImage, articleController.uploadArticleImage);

module.exports = router;
