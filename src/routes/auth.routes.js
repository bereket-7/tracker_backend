const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');
const { authLimiter } = require('../middleware/rateLimit.middleware');

const router = express.Router();

router.post(
  '/register',
  authLimiter,
  [
    body('name')
      .notEmpty()
      .withMessage('Name is required')
      .trim()
      .isLength({ max: 50 })
      .withMessage('Name cannot exceed 50 characters'),
    body('email')
      .isEmail()
      .withMessage('Valid email is required')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters')
      .matches(/\d/)
      .withMessage('Password must contain at least one number'),
    validate,
  ],
  authController.register
);

router.post(
  '/login',
  authLimiter,
  [
    body('email')
      .isEmail()
      .withMessage('Valid email is required')
      .normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
    validate,
  ],
  authController.login
);

router.post(
  '/refresh',
  [
    body('refreshToken').notEmpty().withMessage('Refresh token is required'),
    validate,
  ],
  authController.refresh
);

router.post('/logout', protect, authController.logout);

router.get('/me', protect, authController.getMe);

module.exports = router;
