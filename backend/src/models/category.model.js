const db = require('../config/database');

const CategoryModel = {
  async findById(id) {
    return db.getOne('SELECT * FROM categories WHERE id = ?', [id]);
  },

  async findByUser(userId, { type = '', status = 'active' } = {}) {
    let sql = 'SELECT * FROM categories WHERE (user_id = ? OR user_id IS NULL) AND status = ?';
    const params = [userId, status];
    if (type) { sql += ' AND type = ?'; params.push(type); }
    sql += ' ORDER BY is_default DESC, sort_order ASC, name ASC';
    return db.query(sql, params);
  },

  async findDefault(type = null) {
    let sql = 'SELECT * FROM categories WHERE is_default = 1 AND status = ?';
    const params = ['active'];
    if (type) { sql += ' AND type = ?'; params.push(type); }
    sql += ' ORDER BY sort_order ASC';
    return db.query(sql, params);
  },

  async create(userId, data) {
    const result = await db.insert(
      'INSERT INTO categories (user_id, name, type, icon, color, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, data.name, data.type, data.icon || null, data.color || null, data.sort_order || 0]
    );
    return { id: result.insertId, user_id: userId, ...data };
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    const allowed = ['name', 'type', 'icon', 'color', 'status', 'sort_order'];
    for (const key of allowed) {
      if (data[key] !== undefined) { fields.push(`${key} = ?`); values.push(data[key]); }
    }
    if (fields.length === 0) return { affectedRows: 0 };
    values.push(id);
    return db.update(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, values);
  },

  async delete(id) {
    return db.update('UPDATE categories SET status = ? WHERE id = ?', ['archived', id]);
  },

  async hasTransactions(id) {
    const result = await db.getOne('SELECT COUNT(*) as count FROM transactions WHERE category_id = ? AND status = ?', [id, 'active']);
    return result.count > 0;
  },

  async isOwner(categoryId, userId) {
    const cat = await db.getOne('SELECT user_id, is_default FROM categories WHERE id = ?', [categoryId]);
    return cat && (cat.user_id === userId || cat.is_default === 1);
  },

  async getMostUsed(userId, limit = 5) {
    return db.query(
      `SELECT c.id, c.name, c.type, c.icon, c.color, COUNT(t.id) as usage_count
       FROM categories c
       INNER JOIN transactions t ON c.id = t.category_id
       WHERE t.user_id = ? AND t.status = 'active'
       GROUP BY c.id ORDER BY usage_count DESC LIMIT ?`,
      [userId, limit]
    );
  },

  async getMostUsedSystem(limit = 10) {
    return db.query(
      `SELECT c.id, c.name, c.type, COUNT(t.id) as usage_count
       FROM categories c
       INNER JOIN transactions t ON c.id = t.category_id
       WHERE t.status = 'active'
       GROUP BY c.id ORDER BY usage_count DESC LIMIT ?`,
      [limit]
    );
  }
};

module.exports = CategoryModel;