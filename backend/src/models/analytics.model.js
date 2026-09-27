const db = require('../config/database');

const AnalyticsModel = {
  async findById(id) {
    return db.getOne('SELECT * FROM analytics_snapshots WHERE id = ?', [id]);
  },

  async findByUserMonthYear(userId, month, year) {
    return db.getOne('SELECT * FROM analytics_snapshots WHERE user_id = ? AND month = ? AND year = ?', [userId, month, year]);
  },

  async findByUser(userId, { page = 1, limit = 12 } = {}) {
    const countResult = await db.getOne('SELECT COUNT(*) as total FROM analytics_snapshots WHERE user_id = ?', [userId]);
    const offset = (page - 1) * limit;
    const snapshots = await db.query(
      'SELECT * FROM analytics_snapshots WHERE user_id = ? ORDER BY year DESC, month DESC LIMIT ? OFFSET ?',
      [userId, limit, offset]
    );
    return { snapshots, total: countResult.total };
  },

  async upsert(data) {
    const existing = await this.findByUserMonthYear(data.user_id, data.month, data.year);
    const payload = [
      data.total_income || 0,
      data.total_expense || 0,
      data.total_savings || 0,
      data.top_category_id || null,
      data.transaction_count || 0,
      data.category_breakdown ? JSON.stringify(data.category_breakdown) : null,
      data.daily_breakdown ? JSON.stringify(data.daily_breakdown) : null,
      data.user_id,
      data.month,
      data.year
    ];
    if (existing) {
      await db.update(
        `UPDATE analytics_snapshots SET total_income = ?, total_expense = ?, total_savings = ?,
         top_category_id = ?, transaction_count = ?, category_breakdown = ?, daily_breakdown = ?
         WHERE user_id = ? AND month = ? AND year = ?`,
        payload
      );
      return { id: existing.id, updated: true };
    }
    const result = await db.insert(
      `INSERT INTO analytics_snapshots (total_income, total_expense, total_savings, top_category_id, transaction_count, category_breakdown, daily_breakdown, user_id, month, year)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      payload
    );
    return { id: result.insertId, updated: false };
  },

  async delete(id) {
    return db.remove('DELETE FROM analytics_snapshots WHERE id = ?', [id]);
  }
};

module.exports = AnalyticsModel;
