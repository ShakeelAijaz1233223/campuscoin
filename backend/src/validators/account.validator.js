const { body, param } = require('express-validator');

const createAccountValidator = [
  body('name').trim().notEmpty().withMessage('Account name is required').isLength({ max: 100 }),
  body('type').optional().isIn(['cash', 'bank', 'wallet', 'savings', 'credit', 'other']),
  body('balance').optional({ values: 'null' }).isFloat().withMessage('Balance must be a number'),
  body('currency').optional().isLength({ min: 3, max: 3 }),
  body('icon').optional({ values: 'falsy' }).isLength({ max: 50 }),
  body('color').optional({ values: 'falsy' }).isLength({ max: 20 }),
  body('is_default').optional().isBoolean()
];

const updateAccountValidator = [
  param('id').isInt({ min: 1 }).withMessage('Invalid account id'),
  body('name').optional().trim().notEmpty().isLength({ max: 100 }),
  body('type').optional().isIn(['cash', 'bank', 'wallet', 'savings', 'credit', 'other']),
  body('balance').optional({ values: 'null' }).isFloat(),
  body('is_default').optional().isBoolean(),
  body('status').optional().isIn(['active', 'inactive', 'archived'])
];

const accountIdValidator = [param('id').isInt({ min: 1 }).withMessage('Invalid account id')];

module.exports = { createAccountValidator, updateAccountValidator, accountIdValidator };
