const db = require('../config/database');

const ActivityModel = {
  async create(userId, action, entityType, entityId, description, metadata = null, ip = null) {
    const result = await db.insert(
      'INSERT INTO activities (user_id, action, entity_type, entity_id, description, metadata, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, action, entityType, entityId, description || null, metadata ? JSON.stringify(metadata) : null, ip || null]
    );
    return { id: result.insertId };
  },

  async findByUser(userId, { page = 1, limit = 20, action = '', entity_type = '' } = {}) {
    let where = ['user_id = ?'];
    let params = [userId];
    if (action) { where.push('action = ?'); params.push(action); }
    if (entity_type) { where.push('entity_type = ?'); params.push(entity_type); }
    const countResult = await db.getOne(`SELECT COUNT(*) as total FROM activities WHERE ${where.join(' AND ')}`, params);
    const offset = (page - 1) * limit;
    const activities = await db.query(`SELECT * FROM activities WHERE ${where.join(' AND ')} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
    return { activities, total: countResult.total };
  },

  async findRecent(userId, limit = 10) {
    return db.query('SELECT * FROM activities WHERE user_id = ? ORDER BY created_at DESC LIMIT ?', [userId, limit]);
  },

  async findRecentTransactions(userId, limit = 5) {
    return db.query(
      "SELECT * FROM activities WHERE user_id = ? AND entity_type = 'transaction' AND action IN ('created', 'updated') ORDER BY created_at DESC LIMIT ?",
      [userId, limit]
    );
  }
};

module.exports = ActivityModel;