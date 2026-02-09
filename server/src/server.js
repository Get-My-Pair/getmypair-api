const app = require('./app');
const connectDB = require('./config/db');
const config = require('./config/env');
const logger = require('./utils/logger');
const Role = require('./models/role.model');

// Connect to database
connectDB()
  .then(async () => {
    // Initialize default roles
    try {
      await Role.initializeDefaultRoles();
      logger.info('Default roles initialized');
    } catch (error) {
      logger.error(`Error initializing roles: ${error.message}`);
    }

    // Start server
    const server = app.listen(config.PORT, () => {
      logger.info(
        `Server running in ${config.NODE_ENV} mode on port ${config.PORT}`
      );
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
