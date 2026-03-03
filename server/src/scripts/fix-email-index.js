/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : fix-email-index.js
 * Description: One-off script – fix User collection email index
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
const config = require('../config/env');
const User = require('../models/user.model');

async function fixEmailIndex() {
  try {
    // Connect to database
    await mongoose.connect(config.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Drop existing email index if it exists
    try {
      await User.collection.dropIndex('email_1');
      console.log('✓ Dropped existing email_1 index');
    } catch (err) {
      if (err.code === 27) {
        console.log('ℹ No existing email_1 index to drop');
      } else {
        console.log('ℹ Error dropping index (may not exist):', err.message);
      }
    }

    // Create sparse unique index (allows multiple nulls, unique non-nulls)
    await User.collection.createIndex({ email: 1 }, { sparse: true, unique: true });
    console.log('✓ Created sparse unique index on email field');

    console.log('✓ Email index fixed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing email index:', error);
    process.exit(1);
  }
}

fixEmailIndex();

