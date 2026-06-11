const app = require('./src/app');
const connectDB = require('./src/config/database');
const config = require('./src/config/env');
const logger = require('./src/config/logger');

// Connect to database
connectDB();

// Start server
const PORT = config.port;
const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server running in ${config.env} mode on port ${PORT}`);
  logger.info(`Process ID: ${process.pid}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  server.close(() => {
    logger.info('Server closed due to unhandled rejection');
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});
