const db = require('../config/database');

const NotificationModel = {
  async findById(id) {
    return db.getOne('SELECT * FROM notifications WHERE id = ?', [id]);
  },

  async findByUser(userId, { is_read = '', type = '', page = 1, limit = 20 } = {}) {
    let where = ['user_id = ?'];
    let params = [userId];
    if (is_read !== '') { where.push('is_read = ?'); params.push(parseInt(is_read)); }
    if (type) { where.push('type = ?'); params.push(type); }
    const countResult = await db.getOne(`SELECT COUNT(*) as total FROM notifications WHERE ${where.join(' AND ')}`, params);
    const offset = (page - 1) * limit;
    const notifications = await db.query(`SELECT * FROM notifications WHERE ${where.join(' AND ')} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
    return { notifications, total: countResult.total };
  },

  async create(userId, type, title, message, data = null) {
    const result = await db.insert(
      'INSERT INTO notifications (user_id, type, title, message, data) VALUES (?, ?, ?, ?, ?)',
      [userId, type, title, message, data ? JSON.stringify(data) : null]
    );
    return { id: result.insertId };
  },

  async markRead(id) {
    return db.update('UPDATE notifications SET is_read = 1, read_at = NOW() WHERE id = ?', [id]);
  },

  async markAllRead(userId) {
    return db.update('UPDATE notifications SET is_read = 1, read_at = NOW() WHERE user_id = ? AND is_read = 0', [userId]);
  },

  async getUnreadCount(userId) {
    const result = await db.getOne('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0', [userId]);
    return result.count;
  },

  async delete(id) {
    return db.remove('DELETE FROM notifications WHERE id = ?', [id]);
  },

  async isOwner(notificationId, userId) {
    const n = await db.getOne('SELECT user_id FROM notifications WHERE id = ?', [notificationId]);
    return n && n.user_id === userId;
  }
};

module.exports = NotificationModel;