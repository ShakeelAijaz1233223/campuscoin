const { body, param } = require('express-validator');
const { dateIsValid } = require('./transaction.validator');

const createGoalValidator = [
  body('name').trim().notEmpty().withMessage('Goal name is required').isLength({ max: 200 }),
  body('description').optional({ values: 'falsy' }).trim().isLength({ max: 2000 }),
  body('target_amount').isFloat({ gt: 0 }).withMessage('Target amount must be greater than 0'),
  body('target_date').optional({ values: 'falsy' }).custom(dateIsValid).withMessage('target_date must be YYYY-MM-DD'),
  body('icon').optional({ values: 'falsy' }).isLength({ max: 50 }),
  body('color').optional({ values: 'falsy' }).isLength({ max: 20 })
];

const updateGoalValidator = [
  param('id').isInt({ min: 1 }).withMessage('Invalid goal id'),
  body('name').optional().trim().notEmpty().isLength({ max: 200 }),
  body('description').optional({ values: 'falsy' }).trim().isLength({ max: 2000 }),
  body('target_amount').optional().isFloat({ gt: 0 }),
  body('target_date').optional({ values: 'falsy' }).custom(dateIsValid),
  body('status').optional().isIn(['active', 'completed', 'paused', 'cancelled'])
];

const goalIdValidator = [param('id').isInt({ min: 1 }).withMessage('Invalid goal id')];

const contributionValidator = [
  param('id').isInt({ min: 1 }).withMessage('Invalid goal id'),
  body('amount').isFloat({ gt: 0 }).withMessage('Contribution amount must be greater than 0'),
  body('notes').optional({ values: 'falsy' }).trim().isLength({ max: 1000 }),
  body('date').optional({ values: 'falsy' }).custom(dateIsValid)
];

module.exports = { createGoalValidator, updateGoalValidator, goalIdValidator, contributionValidator };
