const { body, param, query } = require('express-validator');

const createBudgetValidator = [
  body('category_id').isInt({ min: 1 }).withMessage('Valid category_id is required'),
  body('amount').isFloat({ gt: 0 }).withMessage('Budget amount must be greater than 0'),
  body('month').isInt({ min: 1, max: 12 }).withMessage('Month must be 1-12'),
  body('year').isInt({ min: 2000, max: 2100 }).withMessage('Year must be valid')
];

const updateBudgetValidator = [
  param('id').isInt({ min: 1 }).withMessage('Invalid budget id'),
  body('amount').optional().isFloat({ gt: 0 }),
  body('category_id').optional().isInt({ min: 1 })
];

const budgetIdValidator = [param('id').isInt({ min: 1 }).withMessage('Invalid budget id')];

const budgetMonthValidator = [
  query('month').optional().isInt({ min: 1, max: 12 }),
  query('year').optional().isInt({ min: 2000, max: 2100 })
];

module.exports = { createBudgetValidator, updateBudgetValidator, budgetIdValidator, budgetMonthValidator };
