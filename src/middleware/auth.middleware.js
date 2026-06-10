const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/env');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../config/logger');

exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return ApiResponse.error(res, 'Authentication required', 401);
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    
    if (decoded.type !== 'access') {
      return ApiResponse.error(res, 'Invalid token type', 401);
    }

    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return ApiResponse.error(res, 'Authentication failed', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    logger.warn('Authentication failed:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return ApiResponse.error(res, 'Token expired', 401);
    }
    
    return ApiResponse.error(res, 'Authentication failed', 401);
  }
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return ApiResponse.error(res, 'You do not have permission to perform this action', 403);
    }
    next();
  };
};
