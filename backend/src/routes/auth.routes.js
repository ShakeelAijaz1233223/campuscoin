const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimit');
const {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator
} = require('../validators/auth.validator');

// Public auth writes accept JSON only. Cross-site HTML form posts must not
// establish a session in another person's browser (login CSRF).
const requireJSON = (req, res, next) =>
  req.is('application/json')
    ? next()
    : res.status(415).json({
        success: false,
        message: 'Authentication requests require application/json'
      });

router.post(
  '/register',
  requireJSON,
  authLimiter,
  registerValidator,
  validate,
  authController.register
);
router.post(
  '/login',
  requireJSON,
  authLimiter,
  loginValidator,
  validate,
  authController.login
);
router.post(
  '/forgot-password',
  requireJSON,
  authLimiter,
  forgotPasswordValidator,
  validate,
  authController.forgotPassword
);
router.post(
  '/reset-password',
  requireJSON,
  authLimiter,
  resetPasswordValidator,
  validate,
  authController.resetPassword
);
router.get('/me', authenticate, authController.getMe);
router.post('/logout', authenticate, authController.logout);
router.post(
  '/change-password',
  authenticate,
  changePasswordValidator,
  validate,
  authController.changePassword
);

module.exports = router;
