const asyncHandler = require('../utils/asyncHandler');
const adminService = require('../services/admin.service');
const { sendSuccess, sendCreated, sendPaginated } = require('../utils/response');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');

// Dashboard & statistics
const getDashboard = asyncHandler(async (req, res) => {
  const data = await adminService.getAdminDashboard();
  return sendSuccess(res, data, 'Admin dashboard retrieved');
});

const getStatistics = asyncHandler(async (req, res) => {
  const data = await adminService.getStatistics();
  return sendSuccess(res, data, 'Platform statistics retrieved');
});

const getActiveUsers = asyncHandler(async (req, res) => {
  const users = await adminService.getActiveUsers(parseInt(req.query.days) || 30);
  return sendSuccess(res, { users, days: parseInt(req.query.days) || 30 }, 'Active users retrieved');
});

const getMostUsedCategories = asyncHandler(async (req, res) => {
  const categories = await adminService.getMostUsedCategories(parseInt(req.query.limit) || 10);
  return sendSuccess(res, { categories }, 'Most used categories retrieved');
});

const getTransactionCount = asyncHandler(async (req, res) => {
  const data = await adminService.getTransactionCount();
  return sendSuccess(res, data, 'Transaction count retrieved');
});

// Users
const getUsers = asyncHandler(async (req, res) => {
  const pagination = getPagination(req.query);
  const { users, total } = await adminService.getUsers({
    ...pagination,
    search: req.query.search || '',
    status: req.query.status || '',
    role: req.query.role || ''
  });
  const meta = buildPaginationMeta(total, pagination.page, pagination.limit);
  return sendPaginated(res, { users }, meta, 'Users retrieved');
});

const getUserDetail = asyncHandler(async (req, res) => {
  const data = await adminService.getUserDetail(parseInt(req.params.id));
  return sendSuccess(res, data, 'User detail retrieved');
});

const updateUserStatus = asyncHandler(async (req, res) => {
  const user = await adminService.updateUserStatus(parseInt(req.params.id), req.body.status, req.user.id);
  return sendSuccess(res, { user }, 'User status updated');
});

const resetUserAccess = asyncHandler(async (req, res) => {
  const user = await adminService.resetUserAccess(parseInt(req.params.id), req.user.id);
  return sendSuccess(res, { user }, 'User access reset');
});

// Default categories
const getDefaultCategories = asyncHandler(async (req, res) => {
  const categories = await adminService.getDefaultCategoriesAdmin();
  return sendSuccess(res, { categories }, 'Default categories retrieved');
});

const createDefaultCategory = asyncHandler(async (req, res) => {
  const category = await adminService.createDefaultCategory(req.user.id, req.body);
  return sendCreated(res, { category }, 'Default category created');
});

const updateDefaultCategory = asyncHandler(async (req, res) => {
  const category = await adminService.updateDefaultCategory(req.user.id, parseInt(req.params.id), req.body);
  return sendSuccess(res, { category }, 'Default category updated');
});

const deleteDefaultCategory = asyncHandler(async (req, res) => {
  const result = await adminService.deleteDefaultCategory(req.user.id, parseInt(req.params.id));
  return sendSuccess(res, result, 'Default category deleted');
});

// Announcements
const getAnnouncements = asyncHandler(async (req, res) => {
  const pagination = getPagination(req.query);
  const { announcements, total } = await adminService.getAnnouncements({ ...pagination, active: req.query.active === 'true' });
  const meta = buildPaginationMeta(total, pagination.page, pagination.limit);
  return sendPaginated(res, { announcements }, meta, 'Announcements retrieved');
});

const createAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await adminService.createAnnouncement(req.user.id, req.body, req.ip);
  return sendCreated(res, { announcement }, 'Announcement created and users notified');
});

const updateAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await adminService.updateAnnouncement(req.user.id, parseInt(req.params.id), req.body, req.ip);
  return sendSuccess(res, { announcement }, 'Announcement updated');
});

const deleteAnnouncement = asyncHandler(async (req, res) => {
  await adminService.deleteAnnouncement(req.user.id, parseInt(req.params.id), req.ip);
  return sendSuccess(res, null, 'Announcement deleted');
});

// System tips
const getSystemTips = asyncHandler(async (req, res) => {
  const pagination = getPagination(req.query);
  const { tips, total } = await adminService.getSystemTips({ category: req.query.category || '', ...pagination });
  const meta = buildPaginationMeta(total, pagination.page, pagination.limit);
  return sendPaginated(res, { tips }, meta, 'System tips retrieved');
});

const createSystemTip = asyncHandler(async (req, res) => {
  const tip = await adminService.createSystemTip(req.user.id, req.body, req.ip);
  return sendCreated(res, { tip }, 'System tip created');
});

const updateSystemTip = asyncHandler(async (req, res) => {
  const tip = await adminService.updateSystemTip(req.user.id, parseInt(req.params.id), req.body, req.ip);
  return sendSuccess(res, { tip }, 'System tip updated');
});

const deleteSystemTip = asyncHandler(async (req, res) => {
  await adminService.deleteSystemTip(req.user.id, parseInt(req.params.id), req.ip);
  return sendSuccess(res, null, 'System tip deleted');
});

module.exports = {
  getDashboard, getStatistics, getActiveUsers, getMostUsedCategories, getTransactionCount,
  getUsers, getUserDetail, updateUserStatus, resetUserAccess,
  getDefaultCategories, createDefaultCategory, updateDefaultCategory, deleteDefaultCategory,
  getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement,
  getSystemTips, createSystemTip, updateSystemTip, deleteSystemTip
};
