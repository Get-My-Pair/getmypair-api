const app = require('./app');
const connectDB = require('./config/db');
const config = require('./config/env');
const logger = require('./utils/logger');

// Connect to database
connectDB()
  .then(async () => {
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
