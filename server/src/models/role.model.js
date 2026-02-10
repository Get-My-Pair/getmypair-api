const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      enum: ['user', 'admin', 'moderator'],
    },
    description: {
      type: String,
      trim: true,
    },
    permissions: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

roleSchema.index({ name: 1 });

/**
 * Initialize default roles (user, admin, moderator) if they don't exist
 */
roleSchema.statics.initializeDefaultRoles = async function () {
  const defaultRoles = [
    { name: 'user', description: 'Default user role' },
    { name: 'admin', description: 'Administrator role' },
    { name: 'moderator', description: 'Moderator role' },
  ];

  for (const roleData of defaultRoles) {
    await this.findOneAndUpdate(
      { name: roleData.name },
      { $setOnInsert: roleData },
      { upsert: true, new: true }
    );
  }
};

const Role = mongoose.model('Role', roleSchema);

module.exports = Role;
