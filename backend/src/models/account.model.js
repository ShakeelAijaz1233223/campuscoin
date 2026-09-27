const db = require('../config/database');

const AccountModel = {
  async findById(id) {
    return db.getOne('SELECT * FROM accounts WHERE id = ?', [id]);
  },

  async findByUser(userId, { status = 'active' } = {}) {
    return db.query('SELECT * FROM accounts WHERE user_id = ? AND status = ? ORDER BY is_default DESC, name ASC', [userId, status]);
  },

  async findDefault(userId) {
    return db.getOne('SELECT * FROM accounts WHERE user_id = ? AND is_default = 1 AND status = ?', [userId, 'active']);
  },

  async create(userId, data) {
    const result = await db.insert(
      'INSERT INTO accounts (user_id, name, type, balance, currency, icon, color, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, data.name, data.type || 'cash', data.balance || 0, data.currency || 'PKR', data.icon || null, data.color || null, data.is_default ? 1 : 0]
    );
    return { id: result.insertId, ...data };
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    const allowed = ['name', 'type', 'balance', 'currency', 'icon', 'color', 'is_default', 'status'];
    for (const key of allowed) {
      if (data[key] !== undefined) { fields.push(`${key} = ?`); values.push(data[key]); }
    }
    if (fields.length === 0) return { affectedRows: 0 };
    values.push(id);
    return db.update(`UPDATE accounts SET ${fields.join(', ')} WHERE id = ?`, values);
  },

  async updateBalance(id, amount) {
    return db.update('UPDATE accounts SET balance = balance + ? WHERE id = ?', [amount, id]);
  },

  async delete(id) {
    return db.update('UPDATE accounts SET status = ? WHERE id = ?', ['archived', id]);
  },

  async isOwner(accountId, userId) {
    const account = await db.getOne('SELECT user_id FROM accounts WHERE id = ?', [accountId]);
    return account && account.user_id === userId;
  },

  async getTotalBalance(userId) {
    const result = await db.getOne('SELECT COALESCE(SUM(balance), 0) as total FROM accounts WHERE user_id = ? AND status = ?', [userId, 'active']);
    return result.total;
  }
};

module.exports = AccountModel;