const db = require('../config/database');

const AnnouncementModel = {
  async findById(id) {
    return db.getOne('SELECT a.*, u.email as created_by_email FROM announcements a LEFT JOIN users u ON a.created_by = u.id WHERE a.id = ?', [id]);
  },

  async findAll({ page = 1, limit = 20, active = false } = {}) {
    let where = [];
    let params = [];
    if (active) { where.push('a.is_active = 1 AND (a.expires_at IS NULL OR a.expires_at > NOW())'); }
    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const countResult = await db.getOne(`SELECT COUNT(*) as total FROM announcements a ${whereClause}`, params);
    const offset = (page - 1) * limit;
    const announcements = await db.query(`SELECT a.* FROM announcements a ${whereClause} ORDER BY a.created_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
    return { announcements, total: countResult.total };
  },

  async findActive() {
    return db.query("SELECT * FROM announcements WHERE is_active = 1 AND (expires_at IS NULL OR expires_at > NOW()) ORDER BY created_at DESC");
  },

  async create(data) {
    const result = await db.insert(
      'INSERT INTO announcements (title, content, type, is_active, starts_at, expires_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [data.title, data.content, data.type || 'info', data.is_active !== false ? 1 : 0, data.starts_at || null, data.expires_at || null, data.created_by || null]
    );
    return { id: result.insertId };
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    const allowed = ['title', 'content', 'type', 'is_active', 'starts_at', 'expires_at'];
    for (const key of allowed) {
      if (data[key] !== undefined) { fields.push(`${key} = ?`); values.push(data[key]); }
    }
    if (fields.length === 0) return { affectedRows: 0 };
    values.push(id);
    return db.update(`UPDATE announcements SET ${fields.join(', ')} WHERE id = ?`, values);
  },

  async delete(id) {
    return db.remove('DELETE FROM announcements WHERE id = ?', [id]);
  }
};

module.exports = AnnouncementModel;