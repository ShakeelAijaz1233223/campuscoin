const db = require('../config/database');

const ImportModel = {
  async findById(id) {
    return db.getOne('SELECT * FROM imports WHERE id = ?', [id]);
  },

  async findByUser(userId, { page = 1, limit = 20 } = {}) {
    const countResult = await db.getOne('SELECT COUNT(*) as total FROM imports WHERE user_id = ?', [userId]);
    const offset = (page - 1) * limit;
    const imports = await db.query('SELECT * FROM imports WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?', [userId, limit, offset]);
    return { imports, total: countResult.total };
  },

  async create(data) {
    const result = await db.insert(
      'INSERT INTO imports (user_id, filename, original_name, file_size) VALUES (?, ?, ?, ?)',
      [data.user_id, data.filename, data.original_name, data.file_size || 0]
    );
    return { id: result.insertId };
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    const allowed = ['total_rows', 'successful_rows', 'failed_rows', 'duplicate_rows', 'status', 'error_message'];
    for (const key of allowed) {
      if (data[key] !== undefined) { fields.push(`${key} = ?`); values.push(data[key]); }
    }
    if (fields.length === 0) return { affectedRows: 0 };
    values.push(id);
    return db.update(`UPDATE imports SET ${fields.join(', ')} WHERE id = ?`, values);
  },

  async isOwner(importId, userId) {
    const imp = await db.getOne('SELECT user_id FROM imports WHERE id = ?', [importId]);
    return imp && imp.user_id === userId;
  },

  // Import rows
  async createRow(data) {
    const result = await db.insert(
      'INSERT INTO import_rows (import_id, `row_number`, raw_data, status, suggested_category_id, ai_confidence, error_message) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [data.import_id, data.row_number, JSON.stringify(data.raw_data), data.status || 'pending', data.suggested_category_id || null, data.ai_confidence || null, data.error_message || null]
    );
    return { id: result.insertId };
  },

  async getRows(importId, { status = '', page = 1, limit = 100 } = {}) {
    let where = ['import_id = ?'];
    let params = [importId];
    if (status) { where.push('status = ?'); params.push(status); }
    const rows = await db.query(`SELECT * FROM import_rows WHERE ${where.join(' AND ')} ORDER BY \`row_number\` ASC LIMIT ? OFFSET ?`, [...params, limit, (page - 1) * limit]);
    return rows;
  },

  async updateRow(id, data) {
    const fields = [];
    const values = [];
    const allowed = ['status', 'error_message', 'transaction_id', 'suggested_category_id', 'ai_confidence'];
    for (const key of allowed) {
      if (data[key] !== undefined) { fields.push(`${key} = ?`); values.push(data[key]); }
    }
    if (fields.length === 0) return { affectedRows: 0 };
    values.push(id);
    return db.update(`UPDATE import_rows SET ${fields.join(', ')} WHERE id = ?`, values);
  },

  async getRowStats(importId) {
    return db.query(
      'SELECT status, COUNT(*) as count FROM import_rows WHERE import_id = ? GROUP BY status',
      [importId]
    );
  }
};

module.exports = ImportModel;