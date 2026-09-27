const db = require('../config/database');

const TipModel = {
  async findById(id) {
    return db.getOne('SELECT * FROM tips WHERE id = ?', [id]);
  },

  async findAll({ category = '', page = 1, limit = 20 } = {}) {
    let where = ["status = 'active'"];
    let params = [];
    if (category) { where.push('category = ?'); params.push(category); }
    const countResult = await db.getOne(`SELECT COUNT(*) as total FROM tips WHERE ${where.join(' AND ')}`, params);
    const offset = (page - 1) * limit;
    const tips = await db.query(`SELECT * FROM tips WHERE ${where.join(' AND ')} ORDER BY priority DESC, created_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
    return { tips, total: countResult.total };
  },

  async findRandom(limit = 3) {
    return db.query("SELECT * FROM tips WHERE status = 'active' AND is_system = 1 ORDER BY RAND() LIMIT ?", [limit]);
  },

  async create(data) {
    const result = await db.insert(
      'INSERT INTO tips (title, content, category, priority, is_system) VALUES (?, ?, ?, ?, ?)',
      [data.title, data.content, data.category || null, data.priority || 0, data.is_system ? 1 : 0]
    );
    return { id: result.insertId };
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    const allowed = ['title', 'content', 'category', 'priority', 'is_system', 'status'];
    for (const key of allowed) {
      if (data[key] !== undefined) { fields.push(`${key} = ?`); values.push(data[key]); }
    }
    if (fields.length === 0) return { affectedRows: 0 };
    values.push(id);
    return db.update(`UPDATE tips SET ${fields.join(', ')} WHERE id = ?`, values);
  },

  async delete(id) {
    return db.update("UPDATE tips SET status = 'inactive' WHERE id = ?", [id]);
  },

  async search(query) {
    return db.query(
      "SELECT * FROM tips WHERE status = 'active' AND (title LIKE ? OR content LIKE ?) ORDER BY priority DESC LIMIT 20",
      [`%${query}%`, `%${query}%`]
    );
  }
};

module.exports = TipModel;