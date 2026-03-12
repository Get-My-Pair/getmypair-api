/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : article.controller.js
 * Description: Article (Digital Shoe Passport) – create, my, getById, update, delete, upload-image
 * ----------------------------------------------------------------------------
 */

const Article = require('../models/article.model');
const { success, error: errorResponse, notFound } = require('../utils/response');
const logger = require('../utils/logger');
const { uploadToCloudinary, deleteFromCloudinary, getPublicIdFromUrl } = require('../config/cloudinary');

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
 * Get single article by ID (validate owner)
 * GET /api/articles/:articleId
 */
const getArticleById = async (req, res) => {
  try {
    const { articleId } = req.params;
    const ownerId = req.user._id;

    const article = await Article.findOne({ _id: articleId, ownerId }).lean();
    if (!article) {
      return notFound(res, 'Article not found');
    }
    return success(res, 'Article retrieved successfully', { article });
  } catch (err) {
    logger.error(`Get article by id error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

/**
 * Update article (verify owner, then update fields)
 * PUT /api/articles/update/:articleId
 */
const updateArticle = async (req, res) => {
  try {
    const { articleId } = req.params;
    const ownerId = req.user._id;
    const { brand, model, category, color, purchaseYear, materials, condition, images } = req.body;

    const article = await Article.findOne({ _id: articleId, ownerId });
    if (!article) {
      return notFound(res, 'Article not found');
    }

    if (brand !== undefined) article.brand = (brand || '').trim();
    if (model !== undefined) article.model = (model || '').trim();
    if (category !== undefined) article.category = (category || 'other').trim();
    if (color !== undefined) article.color = color ? String(color).trim() : null;
    if (purchaseYear !== undefined) article.purchaseYear = purchaseYear != null ? Number(purchaseYear) : null;
    if (materials !== undefined) article.materials = Array.isArray(materials) ? materials : article.materials;
    if (condition !== undefined) article.condition = (condition || 'good').trim() || 'good';
    if (images !== undefined) article.images = Array.isArray(images) ? images : article.images;

    await article.save();
    logger.info(`Article updated: ${articleId} by owner ${ownerId}`);
    return success(res, 'Article updated successfully', { article });
  } catch (err) {
    logger.error(`Update article error: ${err.message}`);
    return errorResponse(res, err.message, 500);
  }
};

/**
 * Delete article (verify owner, delete record, remove images from Cloudinary)
 * DELETE /api/articles/delete/:articleId
 */
const deleteArticle = async (req, res) => {
  try {
    const { articleId } = req.params;
    const ownerId = req.user._id;

    const article = await Article.findOne({ _id: articleId, ownerId });
    if (!article) {
      return notFound(res, 'Article not found');
    }

    const imageUrls = article.images || [];
    for (const url of imageUrls) {
      const publicId = getPublicIdFromUrl(url);
      if (publicId) {
        await deleteFromCloudinary(publicId, 'image').catch((e) => {
          logger.warn(`Cloudinary delete failed for ${publicId}: ${e.message}`);
        });
      }
    }

    await Article.deleteOne({ _id: articleId, ownerId });
    logger.info(`Article deleted: ${articleId} by owner ${ownerId}`);
    return success(res, 'Article deleted successfully', { articleId });
  } catch (err) {
    logger.error(`Delete article error: ${err.message}`);
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
  getArticleById,
  updateArticle,
  deleteArticle,
  uploadArticleImage,
};
