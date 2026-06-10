const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const responseTime = require('response-time');

const authRoutes = require('./routes/auth.routes');
const taskRoutes = require('./routes/task.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const errorHandler = require('./middleware/error.middleware');
const { globalLimiter } = require('./middleware/rateLimit.middleware');
const config = require('./config/env');
const logger = require('./config/logger');

const app = express();

// Trust proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.env === 'development' ? '*' : config.cors.origin,
  credentials: config.env !== 'development',
}));

// Rate limiting
app.use('/api', globalLimiter);

// Body parser with size limit
app.use(express.json({ limit: config.maxRequestSize }));
app.use(express.urlencoded({ extended: true, limit: config.maxRequestSize }));

// Data sanitization against NoSQL injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Response time tracking
app.use(responseTime((req, res, time) => {
  logger.debug(`${req.method} ${req.url} - ${time.toFixed(2)}ms`);
}));

// Logging
if (config.env === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  }));
}

// Compression
app.use(compression({
  threshold: 1024, // Only compress responses > 1KB
  level: 6,
}));

// API version
const API_VERSION = 'v1';

// Health check
app.get('/health', async (req, res) => {
  const mongoose = require('mongoose');
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.env,
    database: dbStatus,
    version: API_VERSION,
  });
});

// Routes
app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/tasks`, taskRoutes);
app.use(`/api/${API_VERSION}/dashboard`, dashboardRoutes);

// Legacy routes (for backward compatibility)
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handler
app.use(errorHandler);

module.exports = app;
