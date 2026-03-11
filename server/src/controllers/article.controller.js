/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : article.controller.js
 * Description: Article (Digital Shoe Passport) – create, my, upload-image
 * ----------------------------------------------------------------------------
 */

const Article = require('../models/article.model');
const { success, error: errorResponse, notFound } = require('../utils/response');
const logger = require('../utils/logger');
const { uploadToCloudinary } = require('../config/cloudinary');

/**
 * Create Article (register shoe)
 * POST /api/articles/create
 */
const createArticle = async (req, res) => {
  try {
    const ownerId = req.user._id;
    const { brand, model, category, color, purchaseYear, materials, condition, images } = req.body;

    const articleData = {
      ownerId,
      brand: (brand || '').trim(),
      model: (model || '').trim(),
      category: (category || 'other').trim(),
      color: color ? String(color).trim() : null,
      purchaseYear: purchaseYear != null ? Number(purchaseYear) : null,
      materials: Array.isArray(materials) ? materials : [],
      condition: (condition || 'good').trim() || 'good',
      images: Array.isArray(images) ? images : [],
    };

    const article = await Article.create(articleData);
    logger.info(`Article created: ${article._id} for owner ${ownerId}`);
    return success(res, 'Article created successfully', { article }, 201);
  } catch (err) {
    logger.error(`Create article error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

/**
 * Get my articles (shoes for current user)
 * GET /api/articles/my
 */
const getMyArticles = async (req, res) => {
  try {
    const ownerId = req.user._id;
    const articles = await Article.find({ ownerId }).sort({ createdAt: -1 }).lean();
    return success(res, 'Articles retrieved successfully', { articles });
  } catch (err) {
    logger.error(`Get my articles error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

/**
 * Upload article image
 * POST /api/articles/upload-image
 * Body: multipart file field "file"
 * Query: articleId (required) – article to attach image to
 */
const uploadArticleImage = async (req, res) => {
  try {
    const ownerId = req.user._id;
    const articleId = req.body.articleId || req.query.articleId;

    if (!articleId) {
      return errorResponse(res, 'articleId is required (body or query)', 400);
    }

    if (!req.file) {
      return errorResponse(res, 'No file uploaded', 400);
    }

    const article = await Article.findOne({ _id: articleId, ownerId });
    if (!article) {
      return notFound(res, 'Article not found');
    }

    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'getmypair/articles',
      public_id: `article-${articleId}-${Date.now()}`,
      resource_type: 'image',
      transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }],
    });

    const imageUrl = result.secure_url;
    if (!article.images) article.images = [];
    article.images.push(imageUrl);
    await article.save();

    logger.info(`Article image uploaded for article ${articleId}`);
    return success(res, 'Image uploaded successfully', {
      imageUrl,
      articleId: article._id,
      images: article.images,
    });
  } catch (err) {
    logger.error(`Upload article image error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

module.exports = {
  createArticle,
  getMyArticles,
  uploadArticleImage,
};
