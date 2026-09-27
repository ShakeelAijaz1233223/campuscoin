const { body } = require('express-validator');

const updateSettingsValidator = [
  body('currency').optional().isLength({ min: 3, max: 3 }),
  body('theme').optional().isIn(['light', 'dark', 'auto']),
  body('language').optional().isLength({ max: 10 }),
  body('date_format').optional().isLength({ max: 20 }),
  body('monthly_allowance').optional({ values: 'null' }).isFloat({ min: 0 }),
  body('monthly_savings_goal').optional({ values: 'null' }).isFloat({ min: 0 }),
  body('notifications_enabled').optional().isBoolean(),
  body('email_notifications').optional().isBoolean(),
  body('weekly_report').optional().isBoolean(),
  body('default_account_id').optional({ values: 'falsy' }).isInt({ min: 1 })
];

module.exports = { updateSettingsValidator };
