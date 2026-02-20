const mongoose = require('mongoose');
const config = require('../config/env');

const userSchema = new mongoose.Schema(
  {
    mobile: {
      type: String,
<<<<<<< HEAD
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
=======
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      required: true,
      enum: ['male', 'female', 'other'],
      lowercase: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: undefined,
>>>>>>> 87393ab8441ae77f9658bd8e2f32b2026e3272ac
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
      type: String,
      enum: ['user', 'admin', 'moderator'],
      default: 'user',
      lowercase: true,
      index: true,
    },
<<<<<<< HEAD
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
=======
    isPhoneVerified: {
>>>>>>> 87393ab8441ae77f9658bd8e2f32b2026e3272ac
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
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: false,
      transform(doc, ret) {
        return ret;
      },
    },
    toObject: { virtuals: false },
  }
);

<<<<<<< HEAD
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
=======
userSchema.index({ mobile: 1 });
userSchema.index({ role: 1 });
// Sparse unique index for email - allows multiple null values, but unique non-null values
userSchema.index({ email: 1 }, { sparse: true, unique: true });
>>>>>>> 87393ab8441ae77f9658bd8e2f32b2026e3272ac

const User = mongoose.model('User', userSchema);

module.exports = User;
