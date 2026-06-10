const ApiResponse = require('../utils/apiResponse');
const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message);
    return ApiResponse.error(res, 'Validation Error', 400, errors);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return ApiResponse.error(res, `${field} already exists`, 409);
  }

  if (err.name === 'CastError') {
    return ApiResponse.error(res, 'Invalid ID format', 400);
  }

  if (err.name === 'JsonWebTokenError') {
    return ApiResponse.error(res, 'Invalid token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    return ApiResponse.error(res, 'Token expired', 401);
  }

  return ApiResponse.error(
    res,
    err.message || 'Internal Server Error',
    err.statusCode || 500
  );
};

module.exports = errorHandler;
