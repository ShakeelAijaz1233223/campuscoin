const { body, param, query } = require('express-validator');

const userIdValidator = [param('id').isInt({ min: 1 }).withMessage('Invalid user id')];

const userStatusValidator = [
  param('id').isInt({ min: 1 }).withMessage('Invalid user id'),
  body('status').isIn(['active', 'inactive', 'suspended']).withMessage('Status must be active, inactive, or suspended')
];

const defaultCategoryValidator = [
  body('name').trim().notEmpty().withMessage('Category name is required').isLength({ max: 100 }),
  body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  body('icon').optional({ values: 'falsy' }).isLength({ max: 50 }),
  body('color').optional({ values: 'falsy' }).isLength({ max: 20 }),
  body('sort_order').optional().isInt()
];

const defaultCategoryUpdateValidator = [
  param('id').isInt({ min: 1 }).withMessage('Invalid category id'),
  body('name').optional().trim().notEmpty().isLength({ max: 100 }),
  body('icon').optional({ values: 'falsy' }).isLength({ max: 50 }),
  body('color').optional({ values: 'falsy' }).isLength({ max: 20 }),
  body('status').optional().isIn(['active', 'inactive', 'archived']),
  body('sort_order').optional().isInt()
];

const announcementValidator = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 300 }),
  body('content').trim().notEmpty().withMessage('Content is required'),
  body('type').optional().isIn(['info', 'warning', 'maintenance', 'feature']),
  body('is_active').optional().isBoolean(),
  body('starts_at').optional({ values: 'falsy' }).isISO8601(),
  body('expires_at').optional({ values: 'falsy' }).isISO8601(),
  body('notify_users').optional().isBoolean()
];

const announcementUpdateValidator = [
  param('id').isInt({ min: 1 }).withMessage('Invalid announcement id'),
  body('title').optional().trim().notEmpty().isLength({ max: 300 }),
  body('content').optional().trim().notEmpty(),
  body('type').optional().isIn(['info', 'warning', 'maintenance', 'feature']),
  body('is_active').optional().isBoolean()
];

const announcementIdValidator = [param('id').isInt({ min: 1 }).withMessage('Invalid announcement id')];

const systemTipValidator = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 300 }),
  body('content').trim().notEmpty().withMessage('Content is required'),
  body('category').optional({ values: 'falsy' }).isLength({ max: 50 }),
  body('priority').optional().isInt({ min: 0, max: 100 })
];

const systemTipUpdateValidator = [
  param('id').isInt({ min: 1 }).withMessage('Invalid tip id'),
  body('title').optional().trim().notEmpty().isLength({ max: 300 }),
  body('content').optional().trim().notEmpty(),
  body('category').optional({ values: 'falsy' }).isLength({ max: 50 }),
  body('priority').optional().isInt({ min: 0, max: 100 }),
  body('status').optional().isIn(['active', 'inactive'])
];

const systemTipIdValidator = [param('id').isInt({ min: 1 }).withMessage('Invalid tip id')];

const userListValidator = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['active', 'inactive', 'suspended', 'pending', '']),
  query('role').optional().isIn(['student', 'admin', '']),
  query('search').optional().isLength({ max: 200 })
];

module.exports = {
  userIdValidator, userStatusValidator, defaultCategoryValidator, defaultCategoryUpdateValidator,
  announcementValidator, announcementUpdateValidator, announcementIdValidator,
  systemTipValidator, systemTipUpdateValidator, systemTipIdValidator, userListValidator
};
