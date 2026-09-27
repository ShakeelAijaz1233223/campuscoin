const { body, param, query } = require('express-validator');

const confirmImportValidator = [
  param('id').isInt({ min: 1 }).withMessage('Invalid import id'),
  body('include_duplicates').optional().isBoolean(),
  body('skip_duplicates').optional().isBoolean()
];

const correctRowValidator = [
  param('id').isInt({ min: 1 }).withMessage('Invalid import id'),
  param('rowId').isInt({ min: 1 }).withMessage('Invalid row id'),
  body('category_id').optional({ values: 'falsy' }).isInt({ min: 1 }),
  body('action').optional().isIn(['skip', 'categorize'])
];

const importIdValidator = [param('id').isInt({ min: 1 }).withMessage('Invalid import id')];

const listImportsValidator = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
];

module.exports = { confirmImportValidator, correctRowValidator, importIdValidator, listImportsValidator };
