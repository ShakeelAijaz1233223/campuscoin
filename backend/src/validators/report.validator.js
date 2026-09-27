const { query } = require('express-validator');
const { dateIsValid } = require('./transaction.validator');

const monthlyReportValidator = [
  query('month').optional().isInt({ min: 1, max: 12 }),
  query('year').optional().isInt({ min: 2000, max: 2100 })
];

const rangeReportValidator = [
  query('start_date').custom(dateIsValid).withMessage('start_date must be YYYY-MM-DD'),
  query('end_date').custom(dateIsValid).withMessage('end_date must be YYYY-MM-DD'),
  query('group_by').optional().isIn(['daily', 'weekly', 'category']),
  query('category_id').optional({ values: 'falsy' }).isInt({ min: 1 })
];

module.exports = { monthlyReportValidator, rangeReportValidator };
