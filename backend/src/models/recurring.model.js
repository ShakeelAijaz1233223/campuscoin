const db = require('../config/database');

const RecurringModel = {
  async findById(id) {
    return db.getOne('SELECT r.*, c.name as category_name, a.name as account_name FROM recurring_transactions r LEFT JOIN categories c ON r.category_id = c.id LEFT JOIN accounts a ON r.account_id = a.id WHERE r.id = ?', [id]);
  },

  async findByUser(userId, { status = '', page = 1, limit = 20 } = {}) {
    let where = ['r.user_id = ?'];
    let params = [userId];
    if (status === 'active') { where.push('r.is_active = 1'); }
    if (status === 'inactive') { where.push('r.is_active = 0'); }
    const countResult = await db.getOne(`SELECT COUNT(*) as total FROM recurring_transactions r WHERE ${where.join(' AND ')}`, params);
    const offset = (page - 1) * limit;
    const records = await db.query(
      `SELECT r.*, c.name as category_name, a.name as account_name FROM recurring_transactions r LEFT JOIN categories c ON r.category_id = c.id LEFT JOIN accounts a ON r.account_id = a.id WHERE ${where.join(' AND ')} ORDER BY r.next_occurrence ASC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    return { records, total: countResult.total };
  },

  async create(data) {
    const result = await db.insert(
      'INSERT INTO recurring_transactions (user_id, account_id, category_id, type, amount, description, frequency, start_date, end_date, next_occurrence, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [data.user_id, data.account_id, data.category_id || null, data.type, data.amount, data.description || '', data.frequency, data.start_date, data.end_date || null, data.next_occurrence, data.is_active === false ? 0 : 1]
    );
    return { id: result.insertId };
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    const allowed = ['account_id', 'category_id', 'type', 'amount', 'description', 'frequency', 'end_date', 'next_occurrence', 'is_active'];
    for (const key of allowed) {
      if (data[key] !== undefined) { fields.push(`${key} = ?`); values.push(data[key]); }
    }
    if (fields.length === 0) return { affectedRows: 0 };
    values.push(id);
    return db.update(`UPDATE recurring_transactions SET ${fields.join(', ')} WHERE id = ?`, values);
  },

  async delete(id) {
    return db.remove('DELETE FROM recurring_transactions WHERE id = ?', [id]);
  },

  async isOwner(id, userId) {
    const r = await db.getOne('SELECT user_id FROM recurring_transactions WHERE id = ?', [id]);
    return r && r.user_id === userId;
  },

  async getDueForGeneration() {
    return db.query(
      'SELECT r.*, a.user_id as account_user FROM recurring_transactions r INNER JOIN accounts a ON r.account_id = a.id WHERE r.is_active = 1 AND r.next_occurrence <= CURDATE() AND (r.end_date IS NULL OR r.next_occurrence <= r.end_date)'
    );
  },

  async updateAfterGeneration(id, nextOccurrence, lastGenerated) {
    return db.update('UPDATE recurring_transactions SET next_occurrence = ?, last_generated = ? WHERE id = ?', [nextOccurrence, lastGenerated, id]);
  }
};

module.exports = RecurringModel;