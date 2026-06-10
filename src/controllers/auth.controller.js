const AuthService = require('../services/auth.service');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../config/logger');

exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const { user, accessToken, refreshToken } = await AuthService.register(name, email, password);
    
    logger.info(`User registered: ${email}`);
    ApiResponse.success(
      res, 
      { user, accessToken, refreshToken }, 
      'User registered successfully', 
      201
    );
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, accessToken, refreshToken } = await AuthService.login(email, password);
    
    logger.info(`User logged in: ${email}`);
    ApiResponse.success(res, { user, accessToken, refreshToken }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return ApiResponse.error(res, 'Refresh token is required', 400);
    }

    const tokens = await AuthService.refresh(refreshToken);
    
    ApiResponse.success(res, tokens, 'Token refreshed successfully');
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      await AuthService.logout(refreshToken);
    }
    
    logger.info(`User logged out: ${req.user?.email}`);
    ApiResponse.success(res, null, 'Logout successful');
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res) => {
  ApiResponse.success(res, { user: req.user }, 'User retrieved successfully');
};
