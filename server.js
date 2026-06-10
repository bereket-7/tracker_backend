const app = require('./src/app');
const connectDB = require('./src/config/database');
const config = require('./src/config/env');

// Connect to database
connectDB();

// Start server
const PORT = config.port;
const server = app.listen(PORT, () => {
  console.log(`✓ Server running in ${config.env} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});
