const mongoose = require('mongoose');

/**
 * Recycler partner account (bulk footwear drop-off).
 * Separate from the mobile-OTP `User` model: recyclers sign in with email + password.
 */
const recyclerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    organization: {
      type: String,
      trim: true,
      maxlength: 150,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: String,
      enum: ['self', 'masteradmin'],
      default: 'self',
    },
  },
  { timestamps: true }
);

/** Safe shape for API responses (never includes the password hash). */
recyclerSchema.methods.toPublic = function toPublic() {
  return {
    id: String(this._id),
    name: this.name,
    email: this.email,
    phone: this.phone || '',
    organization: this.organization || '',
    address: this.address || '',
    isActive: this.isActive !== false,
    createdBy: this.createdBy,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const Recycler = mongoose.model('Recycler', recyclerSchema);

module.exports = Recycler;
