const { body, param, query } = require('express-validator');
const { dateIsValid } = require('./transaction.validator');

const createRecurringValidator = [
  body('account_id').isInt({ min: 1 }).withMessage('Valid account_id is required'),
  body('category_id').optional({ values: 'falsy' }).isInt({ min: 1 }),
  body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
  body('description').optional({ values: 'falsy' }).trim().isLength({ max: 500 }),
  body('frequency').isIn(['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly']).withMessage('Invalid frequency'),
  body('start_date').custom(dateIsValid).withMessage('start_date must be YYYY-MM-DD'),
  body('end_date').optional({ values: 'falsy' }).custom(dateIsValid).withMessage('end_date must be YYYY-MM-DD')
];

const updateRecurringValidator = [
  param('id').isInt({ min: 1 }).withMessage('Invalid recurring transaction id'),
  body('account_id').optional().isInt({ min: 1 }),
  body('category_id').optional({ values: 'falsy' }).isInt({ min: 1 }),
  body('type').optional().isIn(['income', 'expense']),
  body('amount').optional().isFloat({ gt: 0 }),
  body('description').optional({ values: 'falsy' }).trim().isLength({ max: 500 }),
  body('frequency').optional().isIn(['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly']),
  body('end_date').optional({ values: 'falsy' }).custom(dateIsValid),
  body('is_active').optional().isBoolean()
];

const recurringIdValidator = [param('id').isInt({ min: 1 }).withMessage('Invalid recurring transaction id')];

const listRecurringValidator = [
  query('status').optional().isIn(['active', 'inactive', '']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
];

module.exports = { createRecurringValidator, updateRecurringValidator, recurringIdValidator, listRecurringValidator };
