const asyncHandler = require('../utils/asyncHandler');
const notificationService = require('../services/notification.service');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');

const getNotifications = asyncHandler(async (req, res) => {
  const pagination = getPagination(req.query);
  const result = await notificationService.getNotifications(req.user.id, {
    is_read: req.query.is_read !== undefined ? req.query.is_read : '',
    type: req.query.type || '',
    ...pagination
  });
  const meta = buildPaginationMeta(result.total, pagination.page, pagination.limit);
  return sendPaginated(res, { notifications: result.notifications, unread_count: result.unread_count }, meta, 'Notifications retrieved');
});

const getUnreadCount = asyncHandler(async (req, res) => {
  const result = await notificationService.getUnreadCount(req.user.id);
  return sendSuccess(res, result, 'Unread count retrieved');
});

const markRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markRead(req.user.id, parseInt(req.params.id));
  return sendSuccess(res, { notification }, 'Notification marked as read');
});

const markAllRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllRead(req.user.id);
  return sendSuccess(res, result, 'All notifications marked as read');
});

const deleteNotification = asyncHandler(async (req, res) => {
  await notificationService.deleteNotification(req.user.id, parseInt(req.params.id));
  return sendSuccess(res, null, 'Notification deleted');
});

module.exports = { getNotifications, getUnreadCount, markRead, markAllRead, deleteNotification };
