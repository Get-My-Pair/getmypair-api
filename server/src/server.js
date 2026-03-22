/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : server.js
 * Description: Entry point – connects DB, starts Express server
 * ----------------------------------------------------------------------------
 * Developer  : C Ranjith Kumar
 * LinkedIn         : https://www.linkedin.com/in/coding-ranjith/
 * Personal GitHub  : https://github.com/CodingRanjith
 * Project GitHub   : https://github.com/Ranjithgmp
 * Personal Email   : ranjith.c96me@gmail.com
 * Project Email    : ranjith.kumar@getmypair.com
 * ----------------------------------------------------------------------------
 * Last modified : 2025-03-03
 * ----------------------------------------------------------------------------
 */

const app = require('./app');
const connectDB = require('./config/db');
const config = require('./config/env');
const logger = require('./utils/logger');
const { ensureMasterAdmin } = require('./services/adminMaster.seed');

// Connect to database
connectDB()
  .then(async () => {
    // Fix email index if needed (allows multiple null emails)
    try {
      const User = require('./models/user.model');
      const indexes = await User.collection.getIndexes();
      
      // Check if email_1 index exists and is not sparse
      if (indexes.email_1 && !indexes.email_1.sparse) {
        logger.info('Fixing email index to allow multiple null values...');
        try {
          await User.collection.dropIndex('email_1');
        } catch (err) {
          // Index might not exist, continue
        }
        await User.collection.createIndex({ email: 1 }, { sparse: true, unique: true });
        logger.info('Email index fixed successfully');
      }
    } catch (error) {
      logger.warn(`Could not fix email index: ${error.message}`);
    }

    try {
      await ensureMasterAdmin();
    } catch (error) {
      logger.warn(`Master admin seed skipped or failed: ${error.message}`);
    }

    // Start server
    const server = app.listen(config.PORT, () => {
      const backendUrl = `http://localhost:${config.PORT}`;
      const apiDocsUrl = `${backendUrl}/api-docs`;
      const adminUrl = `${backendUrl}/admin/`;
      const frontendUrl = backendUrl;
      
      logger.info(
        `Server running in ${config.NODE_ENV} mode on port ${config.PORT}`
      );
      
      // Clear console and show success message
      console.clear();
      console.log('\n');
      console.log('============================================================');
      console.log('  Server started successfully');
      console.log('------------------------------------------------------------');
      console.log('  Status:      running');
      console.log('  Database:    MongoDB connected');
      console.log('  Environment: ' + config.NODE_ENV);
      console.log('  Port:        ' + config.PORT);
      console.log('------------------------------------------------------------');
      console.log('  Backend URL:  ' + backendUrl);
      console.log('  API docs:     ' + apiDocsUrl);
      console.log('  Admin panel:  ' + adminUrl);
      console.log('============================================================');
      console.log('\n');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      logger.error(`Unhandled Rejection: ${err.message}`);
      server.close(() => {
        process.exit(1);
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      logger.error(`Uncaught Exception: ${err.message}`);
      process.exit(1);
    });
  })
  .catch((error) => {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  });
