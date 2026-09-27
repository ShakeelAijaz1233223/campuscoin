const NotificationModel = require('../models/notification.model');
const { NotFoundError, ForbiddenError } = require('../utils/errors');

const getNotifications = async (userId, filters) => {
  const { notifications, total } = await NotificationModel.findByUser(userId, filters);
  const unread = await NotificationModel.getUnreadCount(userId);
  return { notifications, total, unread_count: unread };
};

const getUnreadCount = async (userId) => {
  return { unread_count: await NotificationModel.getUnreadCount(userId) };
};

const markRead = async (userId, id) => {
  const notification = await NotificationModel.findById(id);
  if (!notification) throw new NotFoundError('Notification not found');
  if (notification.user_id !== userId) throw new ForbiddenError('Access denied');
  await NotificationModel.markRead(id);
  return NotificationModel.findById(id);
};

const markAllRead = async (userId) => {
  const result = await NotificationModel.markAllRead(userId);
  return { updated: result.affectedRows };
};

const deleteNotification = async (userId, id) => {
  const notification = await NotificationModel.findById(id);
  if (!notification) throw new NotFoundError('Notification not found');
  if (notification.user_id !== userId) throw new ForbiddenError('Access denied');
  await NotificationModel.delete(id);
  return true;
};

module.exports = { getNotifications, getUnreadCount, markRead, markAllRead, deleteNotification };
