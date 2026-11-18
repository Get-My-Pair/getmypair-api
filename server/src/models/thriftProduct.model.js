/**
 * Thrift Store footwear listed by Masteradmin and sold in the user app.
 */
const mongoose = require('mongoose');

const CATEGORIES = ['sneakers', 'formal', 'sports', 'sandals', 'boots', 'slippers', 'kids', 'other'];
const GENDERS = ['men', 'women', 'kids', 'unisex'];
const CONDITIONS = ['new', 'like_new', 'good', 'fair'];

const thriftProductSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    brand: { type: String, required: true, trim: true, maxlength: 80 },
    model: { type: String, trim: true, maxlength: 80, default: '' },
    category: {
      type: String,
      enum: CATEGORIES,
      default: 'sneakers',
      index: true,
    },
    gender: {
      type: String,
      enum: GENDERS,
      default: 'unisex',
    },
    color: { type: String, trim: true, maxlength: 40, default: '' },
    size: { type: String, trim: true, maxlength: 32, default: '' },
    condition: {
      type: String,
      enum: CONDITIONS,
      default: 'good',
    },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    /** Original / MRP price. Optional. Used to show % off. */
    mrp: { type: Number, min: 0, default: 0 },
    /** Selling price the customer pays. */
    price: { type: Number, required: true, min: 1 },
    /** GetMyPair office share of the selling price, 0–100. */
    officePercent: { type: Number, required: true, min: 0, max: 100 },
    discountPercent: { type: Number, min: 0, max: 100, default: 0 },
    stock: { type: Number, min: 0, default: 1 },
    /** First image is the cover. 1 required, up to 3 more. */
    images: {
      type: [String],
      validate: {
        validator(list) {
          return Array.isArray(list) && list.length >= 1 && list.length <= 4;
        },
        message: 'Add 1 cover photo and up to 3 extra photos',
      },
    },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

thriftProductSchema.pre('validate', function setDiscount(next) {
  const mrp = Number(this.mrp) || 0;
  const price = Number(this.price) || 0;
  if (mrp > price && mrp > 0) {
    this.discountPercent = Math.round(((mrp - price) / mrp) * 100);
  } else {
    this.discountPercent = 0;
  }
  next();
});

const ThriftProduct = mongoose.model('ThriftProduct', thriftProductSchema);

module.exports = ThriftProduct;
module.exports.CATEGORIES = CATEGORIES;
module.exports.GENDERS = GENDERS;
module.exports.CONDITIONS = CONDITIONS;
