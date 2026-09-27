const { body, param, query } = require('express-validator');

const dateIsValid = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const createTransactionValidator = [
  body('account_id').isInt({ min: 1 }).withMessage('Valid account_id is required'),
  body('category_id').optional({ values: 'falsy' }).isInt({ min: 1 }),
  body('type').isIn(['income', 'expense', 'transfer']).withMessage('Type must be income, expense, or transfer'),
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
  body('description').optional({ values: 'falsy' }).trim().isLength({ max: 500 }),
  body('notes').optional({ values: 'falsy' }).trim().isLength({ max: 2000 }),
  body('date').custom(dateIsValid).withMessage('Date must be in YYYY-MM-DD format'),
  body('use_ai').optional().isBoolean(),
  body('accept_ai').optional().isBoolean(),
  body('ai_overridden').optional().isBoolean()
];

const updateTransactionValidator = [
  param('id').isInt({ min: 1 }).withMessage('Invalid transaction id'),
  body('account_id').optional().isInt({ min: 1 }),
  body('category_id').optional({ values: 'falsy' }).isInt({ min: 1 }),
  body('type').optional().isIn(['income', 'expense', 'transfer']),
  body('amount').optional().isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
  body('description').optional({ values: 'falsy' }).trim().isLength({ max: 500 }),
  body('notes').optional({ values: 'falsy' }).trim().isLength({ max: 2000 }),
  body('date').optional().custom(dateIsValid).withMessage('Date must be in YYYY-MM-DD format'),
  body('ai_overridden').optional().isBoolean()
];

const transactionIdValidator = [param('id').isInt({ min: 1 }).withMessage('Invalid transaction id')];

const listTransactionsValidator = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('type').optional().isIn(['income', 'expense', 'transfer', '']),
  query('category_id').optional({ values: 'falsy' }).isInt({ min: 1 }),
  query('account_id').optional({ values: 'falsy' }).isInt({ min: 1 }),
  query('start_date').optional().custom(dateIsValid),
  query('end_date').optional().custom(dateIsValid),
  query('min_amount').optional({ values: 'falsy' }).isFloat({ min: 0 }),
  query('max_amount').optional({ values: 'falsy' }).isFloat({ min: 0 }),
  query('sort').optional().isIn(['date', 'amount', 'created_at', 'description']),
  query('order').optional().isIn(['ASC', 'DESC', 'asc', 'desc']),
  query('search').optional().isLength({ max: 200 })
];

module.exports = { createTransactionValidator, updateTransactionValidator, transactionIdValidator, listTransactionsValidator, dateIsValid };
