/**
 * Customer purchase of a Thrift Store pair. Paid through the same Zoho payment flow.
 */
const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 80 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    line1: { type: String, required: true, trim: true, maxlength: 200 },
    line2: { type: String, trim: true, maxlength: 200, default: '' },
    city: { type: String, required: true, trim: true, maxlength: 80 },
    pincode: { type: String, required: true, trim: true, maxlength: 12 },
  },
  { _id: false }
);

const snapshotSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    brand: { type: String, default: '' },
    size: { type: String, default: '' },
    image: { type: String, default: '' },
    price: { type: Number, default: 0 },
    officePercent: { type: Number, default: 0 },
  },
  { _id: false }
);

const thriftOrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ThriftProduct',
      required: true,
      index: true,
    },
    product: { type: snapshotSchema, default: () => ({}) },
    qty: { type: Number, required: true, min: 1, max: 5, default: 1 },
    amount: { type: Number, required: true, min: 1 },
    officePercent: { type: Number, required: true, min: 0, max: 100 },
    officeAmount: { type: Number, required: true, min: 0 },
    address: { type: addressSchema, required: true },
    status: {
      type: String,
      enum: ['pending_payment', 'paid', 'payment_failed', 'cancelled'],
      default: 'pending_payment',
      index: true,
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
    },
    paidAt: { type: Date, default: null },
  },
  { timestamps: true }
);

thriftOrderSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('ThriftOrder', thriftOrderSchema);
