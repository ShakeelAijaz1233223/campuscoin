const { body, param } = require('express-validator');
const { dateIsValid } = require('./transaction.validator');

const createBillValidator = [
  body('name').trim().notEmpty().withMessage('Bill name is required').isLength({ max: 200 }),
  body('is_paid').optional().isBoolean(),
  body('amount').isFloat({ gt: 0 }).withMessage('Bill amount must be greater than 0'),
  body('due_date').custom(dateIsValid).withMessage('due_date must be YYYY-MM-DD'),
  body('category_id').optional({ values: 'falsy' }).isInt({ min: 1 }),
  body('frequency').optional().isIn(['one_time', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly']),
  body('reminder_days').optional().isInt({ min: 0, max: 90 }),
  body('auto_pay').optional().isBoolean(),
  body('notes').optional({ values: 'falsy' }).trim().isLength({ max: 2000 })
];

const updateBillValidator = [
  param('id').isInt({ min: 1 }).withMessage('Invalid bill id'),
  body('name').optional().trim().notEmpty().isLength({ max: 200 }),
  body('is_paid').optional().isBoolean(),
  body('amount').optional().isFloat({ gt: 0 }),
  body('due_date').optional().custom(dateIsValid),
  body('category_id').optional({ values: 'falsy' }).isInt({ min: 1 }),
  body('frequency').optional().isIn(['one_time', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly']),
  body('reminder_days').optional().isInt({ min: 0, max: 90 }),
  body('auto_pay').optional().isBoolean(),
  body('status').optional().isIn(['active', 'completed', 'cancelled', 'archived'])
];

const billIdValidator = [param('id').isInt({ min: 1 }).withMessage('Invalid bill id')];

module.exports = { createBillValidator, updateBillValidator, billIdValidator };
