/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : role.model.js
 * Description: Role schema – name, description; seed USER, COBBER, DELIVERY, ADMIN
 * ----------------------------------------------------------------------------
 * Developer  : C Ranjith Kumar
 * Role       : Backend and Database Developer, Team Lead
 * ----------------------------------------------------------------------------
 * LinkedIn         : https://www.linkedin.com/in/coding-ranjith/
 * Personal GitHub  : https://github.com/CodingRanjith
 * Project GitHub   : https://github.com/Ranjithgmp
 * Personal Email   : ranjith.c96me@gmail.com
 * Project Email    : ranjith.kumar@getmypair.com
 * ----------------------------------------------------------------------------
 * Last modified : 2025-03-03
 * ----------------------------------------------------------------------------
 */

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
