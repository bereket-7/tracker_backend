const rateLimit = require('express-rate-limit');
const config = require('../config/env');

// Global rate limiter
exports.globalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth rate limiter (stricter)
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // relaxed for development
  skipSuccessfulRequests: true,
  message: 'Too many authentication attempts, please try again later.',
});

// User-based rate limiter
exports.userLimiter = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();

  return (req, res, next) => {
    if (!req.user) return next();

    const userId = req.user._id.toString();
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!requests.has(userId)) {
      requests.set(userId, []);
    }

    const userRequests = requests.get(userId).filter(time => time > windowStart);
    
    if (userRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later.',
      });
    }

    userRequests.push(now);
    requests.set(userId, userRequests);

    // Cleanup old entries periodically
    if (Math.random() < 0.01) {
      for (const [key, value] of requests.entries()) {
        if (value.every(time => time < windowStart)) {
          requests.delete(key);
        }
      }
    }

    next();
  };
};
