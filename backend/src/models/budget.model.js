const db = require('../config/database');

const BudgetModel = {
  async findById(id) {
    return db.getOne('SELECT b.*, c.name as category_name, c.icon as category_icon, c.color as category_color FROM budgets b INNER JOIN categories c ON b.category_id = c.id WHERE b.id = ?', [id]);
  },

  async findByUser(userId, month, year) {
    return db.query(
      `SELECT b.*, c.name as category_name, c.icon as category_icon, c.color as category_color
       FROM budgets b INNER JOIN categories c ON b.category_id = c.id
       WHERE b.user_id = ? AND b.month = ? AND b.year = ? AND b.status = 'active'
       ORDER BY c.name ASC`,
      [userId, month, year]
    );
  },

  async findByUserAndCategory(userId, categoryId, month, year) {
    return db.getOne('SELECT * FROM budgets WHERE user_id = ? AND category_id = ? AND month = ? AND year = ?', [userId, categoryId, month, year]);
  },

  async create(data) {
    const result = await db.insert(
      'INSERT INTO budgets (user_id, category_id, amount, month, year) VALUES (?, ?, ?, ?, ?)',
      [data.user_id, data.category_id, data.amount, data.month, data.year]
    );
    return { id: result.insertId };
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    if (data.amount !== undefined) { fields.push('amount = ?'); values.push(data.amount); }
    if (data.spent !== undefined) { fields.push('spent = ?'); values.push(data.spent); }
    if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }
    if (fields.length === 0) return { affectedRows: 0 };
    values.push(id);
    return db.update(`UPDATE budgets SET ${fields.join(', ')} WHERE id = ?`, values);
  },

  async updateSpent(id, spent) {
    return db.update('UPDATE budgets SET spent = ? WHERE id = ?', [spent, id]);
  },

  async delete(id) {
    return db.update("UPDATE budgets SET status = 'archived' WHERE id = ?", [id]);
  },

  async isOwner(budgetId, userId) {
    const b = await db.getOne('SELECT user_id FROM budgets WHERE id = ?', [budgetId]);
    return b && b.user_id === userId;
  },

  async recalculateSpent(userId, month, year) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endOfMonth = new Date(year, month, 0);
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(endOfMonth.getDate()).padStart(2, '0')}`;

    const results = await db.query(
      `SELECT category_id, COALESCE(SUM(amount), 0) as total
       FROM transactions WHERE user_id = ? AND type = 'expense' AND date >= ? AND date <= ? AND status = 'active'
       GROUP BY category_id`,
      [userId, startDate, endDate]
    );

    for (const row of results) {
      await db.update(
        'UPDATE budgets SET spent = ? WHERE user_id = ? AND category_id = ? AND month = ? AND year = ?',
        [row.total, userId, row.category_id, month, year]
      );
    }

    return results;
  },

  async getNearLimit(userId, month, year, threshold = 0.8) {
    return db.query(
      `SELECT b.*, c.name as category_name FROM budgets b
       INNER JOIN categories c ON b.category_id = c.id
       WHERE b.user_id = ? AND b.month = ? AND b.year = ? AND b.status = 'active'
       AND b.spent >= (b.amount * ?) AND b.spent < b.amount`,
      [userId, month, year, threshold]
    );
  },

  async getExceeded(userId, month, year) {
    return db.query(
      `SELECT b.*, c.name as category_name FROM budgets b
       INNER JOIN categories c ON b.category_id = c.id
       WHERE b.user_id = ? AND b.month = ? AND b.year = ? AND b.status = 'active' AND b.spent > b.amount`,
      [userId, month, year]
    );
  },

  async getTotalBudget(userId, month, year) {
    const result = await db.getOne(
      'SELECT COALESCE(SUM(amount), 0) as total, COALESCE(SUM(spent), 0) as spent FROM budgets WHERE user_id = ? AND month = ? AND year = ? AND status = ?',
      [userId, month, year, 'active']
    );
    return result;
  }
};

module.exports = BudgetModel;