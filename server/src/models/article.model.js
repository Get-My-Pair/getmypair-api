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
    /** "self" = account holder; otherwise family member id */
    profileId: {
      type: String,
      default: 'self',
      trim: true,
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
    /** luxury or everyday — drives Sell My Pair racks */
    footwearType: {
      type: String,
      trim: true,
      enum: ['luxury', 'everyday'],
      default: 'everyday',
      index: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      enum: [
        'sports_shoe',
        'sneaker',
        'running',
        'trainer',
        'basketball',
        'football',
        'casual',
        'formal',
        'loafer',
        'oxford',
        'heel',
        'sandal',
        'flip_flop',
        'slide',
        'boot',
        'ankle_boot',
        'slipper',
        'school',
        'kids',
        'safety',
        'ethnic',
        'canvas',
        'other',
      ],
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
    /** e.g. "UK: 08", "US: 09", "EU: 42" from mobile app */
    shoeSize: {
      type: String,
      trim: true,
      maxlength: 32,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: false },
    toObject: { virtuals: false },
  }
);

articleSchema.index({ ownerId: 1, createdAt: -1 });
articleSchema.index({ ownerId: 1, profileId: 1, createdAt: -1 });

const Article = mongoose.model('Article', articleSchema);

module.exports = Article;
