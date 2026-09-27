const db = require('../config/database');

const InsightModel = {
  async findById(id) {
    return db.getOne('SELECT * FROM insights WHERE id = ?', [id]);
  },

  async findByUser(userId, { page = 1, limit = 12 } = {}) {
    const countResult = await db.getOne('SELECT COUNT(*) as total FROM insights WHERE user_id = ?', [userId]);
    const offset = (page - 1) * limit;
    const insights = await db.query('SELECT * FROM insights WHERE user_id = ? ORDER BY year DESC, month DESC LIMIT ? OFFSET ?', [userId, limit, offset]);
    return { insights, total: countResult.total };
  },

  async findByMonthYear(userId, month, year) {
    return db.getOne('SELECT * FROM insights WHERE user_id = ? AND month = ? AND year = ?', [userId, month, year]);
  },

  async create(data) {
    const result = await db.insert(
      'INSERT INTO insights (user_id, month, year, summary, tip, metadata) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE summary = VALUES(summary), tip = VALUES(tip), metadata = VALUES(metadata), generated_at = NOW()',
      [data.user_id, data.month, data.year, data.summary, data.tip || null, data.metadata ? JSON.stringify(data.metadata) : null]
    );
    return { insertId: result.insertId };
  },

  async getLatest(userId) {
    return db.getOne('SELECT * FROM insights WHERE user_id = ? ORDER BY year DESC, month DESC LIMIT 1', [userId]);
  },

  async search(userId, query) {
    return db.query(
      'SELECT * FROM insights WHERE user_id = ? AND (summary LIKE ? OR tip LIKE ?) ORDER BY year DESC, month DESC LIMIT 20',
      [userId, `%${query}%`, `%${query}%`]
    );
  }
};

module.exports = InsightModel;