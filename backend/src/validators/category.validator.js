const { body, param, query } = require('express-validator');

const createCategoryValidator = [
  body('name').trim().notEmpty().withMessage('Category name is required').isLength({ max: 100 }),
  body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  body('icon').optional({ values: 'falsy' }).isLength({ max: 50 }),
  body('color').optional({ values: 'falsy' }).isLength({ max: 20 }),
  body('sort_order').optional().isInt()
];

const updateCategoryValidator = [
  param('id').isInt({ min: 1 }).withMessage('Invalid category id'),
  body('name').optional().trim().notEmpty().isLength({ max: 100 }),
  body('icon').optional({ values: 'falsy' }).isLength({ max: 50 }),
  body('color').optional({ values: 'falsy' }).isLength({ max: 20 }),
  body('status').optional().isIn(['active', 'inactive', 'archived']),
  body('sort_order').optional().isInt()
];

const categoryIdValidator = [param('id').isInt({ min: 1 }).withMessage('Invalid category id')];

const listCategoriesValidator = [
  query('type').optional().isIn(['income', 'expense', ''])
];

module.exports = { createCategoryValidator, updateCategoryValidator, categoryIdValidator, listCategoriesValidator };
