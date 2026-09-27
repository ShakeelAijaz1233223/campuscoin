const { body } = require('express-validator');

const updateProfileValidator = [
  body('first_name').optional().trim().notEmpty().withMessage('First name cannot be empty').isLength({ max: 100 }),
  body('last_name').optional({ values: 'falsy' }).trim().isLength({ max: 100 }),
  body('phone').optional({ values: 'falsy' }).trim().isLength({ max: 20 }),
  body('avatar_url').optional({ values: 'falsy' }).trim().isLength({ max: 500 }),
  body('academic_year').optional().isIn(['freshman', 'sophomore', 'junior', 'senior', 'graduate', 'other']).withMessage('Invalid academic year'),
  body('monthly_allowance').optional({ values: 'null' }).isFloat({ min: 0 }).withMessage('Monthly allowance must be a positive number'),
  body('monthly_savings_goal').optional({ values: 'null' }).isFloat({ min: 0 }).withMessage('Monthly savings goal must be a positive number'),
  body('currency').optional().isLength({ min: 3, max: 3 }),
  body('date_format').optional().isLength({ max: 20 }),
  body('theme').optional().isIn(['light', 'dark', 'auto']),
  body('language').optional().isLength({ max: 10 })
];

const updatePreferencesValidator = [
  body().isObject().withMessage('Preferences must be an object')
];

module.exports = { updateProfileValidator, updatePreferencesValidator };
