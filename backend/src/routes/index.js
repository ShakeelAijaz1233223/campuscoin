const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'CampusCoin API v1',
    version: '1.0.0',
    endpoints: [
      '/auth', '/ai', '/profile', '/accounts', '/categories', '/transactions',
      '/recurring-transactions', '/budgets', '/goals', '/bills', '/dashboard',
      '/analytics', '/reports', '/insights', '/tips', '/bookmarks', '/notes',
      '/notifications', '/imports', '/exports', '/search', '/settings',
      '/content', '/admin'
    ]
  });
});

router.use('/auth', require('./auth.routes'));
router.use('/ai', require('./ai.routes'));
router.use('/profile', require('./profile.routes'));
router.use('/accounts', require('./account.routes'));
router.use('/categories', require('./category.routes'));
router.use('/transactions', require('./transaction.routes'));
router.use('/recurring-transactions', require('./recurring.routes'));
router.use('/budgets', require('./budget.routes'));
router.use('/goals', require('./goal.routes'));
router.use('/bills', require('./bill.routes'));
router.use('/dashboard', require('./dashboard.routes'));
router.use('/analytics', require('./analytics.routes'));
router.use('/reports', require('./report.routes'));
router.use('/insights', require('./insight.routes'));
router.use('/tips', require('./tip.routes'));
router.use('/bookmarks', require('./bookmark.routes'));
router.use('/notes', require('./note.routes'));
router.use('/notifications', require('./notification.routes'));
router.use('/imports', require('./import.routes'));
router.use('/exports', require('./export.routes'));
router.use('/search', require('./search.routes'));
router.use('/settings', require('./settings.routes'));
router.use('/content', require('./content.routes'));
router.use('/admin', require('./admin.routes'));

module.exports = router;
