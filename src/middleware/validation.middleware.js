const { validationResult } = require('express-validator');
const ApiResponse = require('../utils/apiResponse');

exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return ApiResponse.error(
      res,
      'Validation failed',
      400,
      errors.array().map((err) => err.msg)
    );
  }
  next();
};
