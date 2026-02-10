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
      const backendUrl = `http://localhost:${config.PORT}`;
      logger.info(
        `Server running in ${config.NODE_ENV} mode on port ${config.PORT}`
      );
      console.log('\n========================================');
      console.log('  Backend successfully running');
      console.log('  MongoDB connected');
      console.log('  Default roles initialized');
      console.log('  Server running in', config.NODE_ENV, 'mode on port', config.PORT);
      console.log('  Backend URL:', backendUrl);
      console.log('  API Docs:', `${backendUrl}/api-docs`);
      console.log('========================================\n');
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
