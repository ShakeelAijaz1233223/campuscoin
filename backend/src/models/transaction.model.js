const db = require('../config/database');

const TransactionModel = {
  async findById(id) {
    return db.getOne(
      `SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color,
       a.name as account_name, a.type as account_type
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       LEFT JOIN accounts a ON t.account_id = a.id
       WHERE t.id = ?`,
      [id]
    );
  },

  async findByUser(userId, filters = {}) {
    const { page = 1, limit = 20, type, category_id, account_id, startDate, endDate, search, sort = 'date', order = 'DESC', status = 'active' } = filters;
    let where = ['t.user_id = ?', 't.status = ?'];
    let params = [userId, status];

    if (type) { where.push('t.type = ?'); params.push(type); }
    if (category_id) { where.push('t.category_id = ?'); params.push(category_id); }
    if (account_id) { where.push('t.account_id = ?'); params.push(account_id); }
    if (startDate) { where.push('t.date >= ?'); params.push(startDate); }
    if (endDate) { where.push('t.date <= ?'); params.push(endDate); }
    if (filters.minAmount !== '' && filters.minAmount !== undefined && filters.minAmount !== null) { where.push('t.amount >= ?'); params.push(filters.minAmount); }
    if (filters.maxAmount !== '' && filters.maxAmount !== undefined && filters.maxAmount !== null) { where.push('t.amount <= ?'); params.push(filters.maxAmount); }
    if (search) { where.push('(t.description LIKE ? OR t.notes LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }

    const whereClause = where.join(' AND ');
    const countResult = await db.getOne(`SELECT COUNT(*) as total FROM transactions t WHERE ${whereClause}`, params);
    const total = countResult.total;
    const offset = (page - 1) * limit;

    const allowedSorts = ['date', 'amount', 'created_at', 'description'];
    const sortField = allowedSorts.includes(sort) ? sort : 'date';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const transactions = await db.query(
      `SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color,
       a.name as account_name, a.type as account_type
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       LEFT JOIN accounts a ON t.account_id = a.id
       WHERE ${whereClause}
       ORDER BY t.${sortField} ${sortOrder}, t.id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return { transactions, total };
  },

  async create(data) {
    const result = await db.insert(
      `INSERT INTO transactions (user_id, account_id, category_id, recurring_id, import_id, type, amount, description, notes, date, ai_suggested_category_id, ai_confidence, ai_overridden, is_duplicate, duplicate_of)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.user_id, data.account_id, data.category_id || null, data.recurring_id || null, data.import_id || null,
       data.type, data.amount, data.description || '', data.notes || null, data.date,
       data.ai_suggested_category_id || null, data.ai_confidence || null, data.ai_overridden ? 1 : 0,
       data.is_duplicate ? 1 : 0, data.duplicate_of || null]
    );
    return { id: result.insertId };
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    const allowed = ['account_id', 'category_id', 'type', 'amount', 'description', 'notes', 'date', 'ai_overridden'];
    for (const key of allowed) {
      if (data[key] !== undefined) { fields.push(`${key} = ?`); values.push(data[key]); }
    }
    if (fields.length === 0) return { affectedRows: 0 };
    values.push(id);
    return db.update(`UPDATE transactions SET ${fields.join(', ')} WHERE id = ?`, values);
  },

  async softDelete(id) {
    return db.update("UPDATE transactions SET status = 'deleted' WHERE id = ?", [id]);
  },

  async isOwner(transactionId, userId) {
    const t = await db.getOne('SELECT user_id FROM transactions WHERE id = ?', [transactionId]);
    return t && t.user_id === userId;
  },

  async getTotalByType(userId, startDate, endDate, type, status = 'active') {
    const result = await db.getOne(
      'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = ? AND date >= ? AND date <= ? AND status = ?',
      [userId, type, startDate, endDate, status]
    );
    return parseFloat(result.total);
  },

  async getCategorySpending(userId, startDate, endDate) {
    return db.query(
      `SELECT c.id as category_id, c.name as category_name, c.icon, c.color,
       COALESCE(SUM(t.amount), 0) as total, COUNT(t.id) as count
       FROM transactions t
       INNER JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = ? AND t.type = 'expense' AND t.date >= ? AND t.date <= ? AND t.status = 'active'
       GROUP BY c.id ORDER BY total DESC`,
      [userId, startDate, endDate]
    );
  },

  async getDailySpending(userId, startDate, endDate) {
    return db.query(
      `SELECT date, type, COALESCE(SUM(amount), 0) as total, COUNT(id) as count
       FROM transactions WHERE user_id = ? AND date >= ? AND date <= ? AND status = 'active'
       GROUP BY date, type ORDER BY date ASC`,
      [userId, startDate, endDate]
    );
  },

  async getMonthlyTotals(userId, months = 6) {
    return db.query(
      `SELECT YEAR(date) as year, MONTH(date) as month, type,
       COALESCE(SUM(amount), 0) as total, COUNT(id) as count
       FROM transactions WHERE user_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL ? MONTH) AND status = 'active'
       GROUP BY YEAR(date), MONTH(date), type ORDER BY year, month`,
      [userId, months]
    );
  },

  async getRecent(userId, limit = 5) {
    return db.query(
      `SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color,
       a.name as account_name
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       LEFT JOIN accounts a ON t.account_id = a.id
       WHERE t.user_id = ? AND t.status = 'active'
       ORDER BY t.date DESC, t.created_at DESC LIMIT ?`,
      [userId, limit]
    );
  },

  async getTopCategory(userId, startDate, endDate) {
    return db.getOne(
      `SELECT c.name, SUM(t.amount) as total
       FROM transactions t INNER JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = ? AND t.type = 'expense' AND t.date >= ? AND t.date <= ? AND t.status = 'active'
       GROUP BY c.id ORDER BY total DESC LIMIT 1`,
      [userId, startDate, endDate]
    );
  },

  async findDuplicates(userId, amount, description, date, hours = 24) {
    return db.query(
      `SELECT * FROM transactions
       WHERE user_id = ? AND ABS(amount - ?) < 0.01 AND description = ? AND status = 'active'
       AND date >= DATE_SUB(?, INTERVAL ? HOUR)`,
      [userId, amount, description, date, hours]
    );
  },

  async getUnusuallyLarge(userId, threshold) {
    return db.query(
      `SELECT t.*, c.name as category_name FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = ? AND t.amount > ? AND t.status = 'active' AND t.type = 'expense'
       ORDER BY t.amount DESC LIMIT 10`,
      [userId, threshold]
    );
  },

  async count(userId) {
    const result = await db.getOne('SELECT COUNT(*) as total FROM transactions WHERE user_id = ? AND status = ?', [userId, 'active']);
    return result.total;
  },

  async countAll() {
    const result = await db.getOne('SELECT COUNT(*) as total FROM transactions WHERE status = ?', ['active']);
    return result.total;
  },

  async getWeeklySpending(userId, startDate, endDate) {
    return db.query(
      `SELECT YEAR(date) as year, WEEK(date) as week, type,
       COALESCE(SUM(amount), 0) as total, COUNT(id) as count
       FROM transactions WHERE user_id = ? AND date >= ? AND date <= ? AND status = 'active'
       GROUP BY YEAR(date), WEEK(date), type ORDER BY year, week`,
      [userId, startDate, endDate]
    );
  },

  async search(userId, query) {
    return db.query(
      `SELECT t.*, c.name as category_name, a.name as account_name
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       LEFT JOIN accounts a ON t.account_id = a.id
       WHERE t.user_id = ? AND t.status = 'active' AND (t.description LIKE ? OR t.notes LIKE ?)
       ORDER BY t.date DESC LIMIT 50`,
      [userId, `%${query}%`, `%${query}%`]
    );
  }
};

module.exports = TransactionModel;