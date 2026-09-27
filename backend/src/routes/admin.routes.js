const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const {
  userIdValidator, userStatusValidator, defaultCategoryValidator, defaultCategoryUpdateValidator,
  announcementValidator, announcementUpdateValidator, announcementIdValidator,
  systemTipValidator, systemTipUpdateValidator, systemTipIdValidator, userListValidator
} = require('../validators/admin.validator');

// Every admin route requires authentication AND the admin role
router.use(authenticate, authorize('admin'));

// Dashboard & statistics
router.get('/dashboard', adminController.getDashboard);
router.get('/statistics', adminController.getStatistics);
router.get('/statistics/active-users', adminController.getActiveUsers);
router.get('/statistics/transactions', adminController.getTransactionCount);
router.get('/statistics/categories', adminController.getMostUsedCategories);

// Users
router.get('/users', userListValidator, validate, adminController.getUsers);
router.get('/users/:id', userIdValidator, validate, adminController.getUserDetail);
router.patch('/users/:id/status', userStatusValidator, validate, adminController.updateUserStatus);
router.post('/users/:id/reset-access', userIdValidator, validate, adminController.resetUserAccess);

// Default categories
router.get('/default-categories', adminController.getDefaultCategories);
router.post('/default-categories', defaultCategoryValidator, validate, adminController.createDefaultCategory);
router.put('/default-categories/:id', defaultCategoryUpdateValidator, validate, adminController.updateDefaultCategory);
router.delete('/default-categories/:id', userIdValidator, validate, adminController.deleteDefaultCategory);

// Announcements
router.get('/announcements', adminController.getAnnouncements);
router.post('/announcements', announcementValidator, validate, adminController.createAnnouncement);
router.put('/announcements/:id', announcementUpdateValidator, validate, adminController.updateAnnouncement);
router.delete('/announcements/:id', announcementIdValidator, validate, adminController.deleteAnnouncement);

// System tips
router.get('/tips', adminController.getSystemTips);
router.post('/tips', systemTipValidator, validate, adminController.createSystemTip);
router.put('/tips/:id', systemTipUpdateValidator, validate, adminController.updateSystemTip);
router.delete('/tips/:id', systemTipIdValidator, validate, adminController.deleteSystemTip);

module.exports = router;
