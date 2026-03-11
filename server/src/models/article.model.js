/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : article.model.js
 * Description: Article (Digital Shoe Passport) – ownerId, brand, model, category, materials, condition, images
 * ----------------------------------------------------------------------------
 * Developer  : C Ranjith Kumar
 * ----------------------------------------------------------------------------
 */

const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, trim: true, maxlength: 100 },
    percentage: { type: Number, min: 0, max: 100, default: null },
  },
  { _id: false }
);

const articleSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    brand: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    model: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      enum: ['sports_shoe', 'casual', 'formal', 'sandal', 'boot', 'slipper', 'other'],
      default: 'other',
    },
    color: {
      type: String,
      trim: true,
      maxlength: 60,
      default: null,
    },
    purchaseYear: {
      type: Number,
      min: 1900,
      max: 2100,
      default: null,
    },
    materials: {
      type: [materialSchema],
      default: [],
    },
    condition: {
      type: String,
      trim: true,
      enum: ['excellent', 'good', 'fair', 'worn', ''],
      default: 'good',
    },
    images: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: false },
    toObject: { virtuals: false },
  }
);

articleSchema.index({ ownerId: 1, createdAt: -1 });

const Article = mongoose.model('Article', articleSchema);

module.exports = Article;
