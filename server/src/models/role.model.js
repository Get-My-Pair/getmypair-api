const mongoose = require('mongoose');
const { VALID_ROLES } = require('../config/roles');

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      enum: VALID_ROLES,
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
 * Initialize default roles (USER, COBBER, DELIVERY, ADMIN) if they don't exist
 */
roleSchema.statics.initializeDefaultRoles = async function () {
  const defaultRoles = [
    { name: 'USER', description: 'User App role' },
    { name: 'COBBER', description: 'Cobber App role' },
    { name: 'DELIVERY', description: 'Delivery App role' },
    { name: 'ADMIN', description: 'Admin App role' },
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
