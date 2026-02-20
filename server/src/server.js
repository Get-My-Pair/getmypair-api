const app = require('./app');
const connectDB = require('./config/db');
const config = require('./config/env');
const logger = require('./utils/logger');

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

    // Start server
    const server = app.listen(config.PORT, () => {
      const backendUrl = `http://localhost:${config.PORT}`;
      const apiDocsUrl = `${backendUrl}/api-docs`;
      const frontendUrl = backendUrl;
      
      logger.info(
        `Server running in ${config.NODE_ENV} mode on port ${config.PORT}`
      );
      
      // Clear console and show success message
      console.clear();
      console.log('\n');
      console.log('╔════════════════════════════════════════════════════════════╗');
      console.log('║                                                            ║');
      console.log('║          ✅  SERVER STARTED SUCCESSFULLY  ✅              ║');
      console.log('║                                                            ║');
      console.log('╠════════════════════════════════════════════════════════════╣');
      console.log('║                                                            ║');
      console.log('║  📊 Status:     Server is running                         ║');
      console.log('║  🗄️  Database:   MongoDB connected                        ║');
      console.log('║  🌍 Environment: ' + config.NODE_ENV.padEnd(43) + '║');
      console.log('║  🔌 Port:       ' + config.PORT.toString().padEnd(43) + '║');
      console.log('║                                                            ║');
      console.log('╠════════════════════════════════════════════════════════════╣');
      console.log('║                                                            ║');
      console.log('║  🔗 Backend URL:                                           ║');
      console.log('║     ' + backendUrl.padEnd(59) + '║');
      console.log('║                                                            ║');
      console.log('║  📚 API Docs:                                              ║');
      console.log('║     ' + apiDocsUrl.padEnd(59) + '║');
      console.log('║                                                            ║');
      console.log('║  🖥️  Frontend:                                              ║');
      console.log('║     ' + frontendUrl.padEnd(59) + '║');
      console.log('║                                                            ║');
      console.log('╚════════════════════════════════════════════════════════════╝');
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
