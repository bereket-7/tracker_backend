const AuthService = require('../services/auth.service');
const ApiResponse = require('../utils/apiResponse');

exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const { user, token } = await AuthService.register(name, email, password);
    
    ApiResponse.success(res, { user, token }, 'User registered successfully', 201);
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await AuthService.login(email, password);
    
    ApiResponse.success(res, { user, token }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res) => {
  ApiResponse.success(res, { user: req.user }, 'User retrieved successfully');
};
