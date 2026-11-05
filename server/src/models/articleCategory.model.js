/**
 * Article categories managed by Masteradmin (Article DB).
 * Used by user-app add/edit article dropdowns and CareMyPair service filtering.
 */
const mongoose = require('mongoose');

const articleCategorySchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminMaster',
      default: null,
    },
  },
  { timestamps: true }
);

articleCategorySchema.index({ sortOrder: 1, createdAt: 1 });

module.exports = mongoose.model('ArticleCategory', articleCategorySchema);
