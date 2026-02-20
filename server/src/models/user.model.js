const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config/env');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      sparse: true, // unique but allow null
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      minlength: 6,
      select: false,
    },
    mobile: {
      type: String,
      sparse: true,
      trim: true,
      index: true,
    },
    firstName: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    phone: {
      type: String,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say'],
      trim: true,
    },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
      required: true,
      index: true,
    },
    profileCompleted: {
      type: Boolean,
      default: false,
    },
    location: {
      lat: { type: Number },
      lng: { type: Number },
      address: { type: String, trim: true },
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: false,
      transform(doc, ret) {
        delete ret.password;
        delete ret.loginAttempts;
        delete ret.lockUntil;
        return ret;
      },
    },
    toObject: { virtuals: false },
  }
);

userSchema.index({ email: 1 }, { sparse: true });
userSchema.index({ mobile: 1 }, { sparse: true });
userSchema.index({ role: 1 });

// User must have email OR mobile
userSchema.pre('validate', function (next) {
  if (!this.email && !this.mobile) {
    next(new Error('Either email or mobile is required'));
  } else {
    next();
  }
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Virtual for checking if account is currently locked
userSchema.virtual('lockoutExpired').get(function () {
  return !this.lockUntil || this.lockUntil < new Date();
});

// Compare password with hashed password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Increment login attempts and lock account if exceeds max
userSchema.methods.incLoginAttempts = async function () {
  // If lock has expired, reset attempts
  if (this.lockoutExpired) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };
  const maxAttempts = config.MAX_LOGIN_ATTEMPTS || 5;
  const lockMinutes = config.LOCKOUT_DURATION_MINUTES || 30;

  if (this.loginAttempts + 1 >= maxAttempts) {
    updates.$set = {
      lockUntil: new Date(Date.now() + lockMinutes * 60 * 1000),
      isLocked: true,
    };
  }

  return this.updateOne(updates);
};

// Reset login attempts after successful login
userSchema.methods.resetLoginAttempts = async function () {
  this.loginAttempts = 0;
  this.isLocked = false;
  this.lockUntil = undefined;
  return this.save();
};

const User = mongoose.model('User', userSchema);

module.exports = User;
