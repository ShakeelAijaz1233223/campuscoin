const db = require('../config/database');

const NoteModel = {
  async findById(id) {
    return db.getOne('SELECT * FROM notes WHERE id = ?', [id]);
  },

  async findByUser(userId, { status = 'active', page = 1, limit = 20 } = {}) {
    let where = ['user_id = ?', 'status = ?'];
    let params = [userId, status];
    const countResult = await db.getOne(`SELECT COUNT(*) as total FROM notes WHERE ${where.join(' AND ')}`, params);
    const offset = (page - 1) * limit;
    const notes = await db.query(`SELECT * FROM notes WHERE ${where.join(' AND ')} ORDER BY is_pinned DESC, updated_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
    return { notes, total: countResult.total };
  },

  async create(userId, data) {
    const result = await db.insert(
      'INSERT INTO notes (user_id, title, content, color, is_pinned) VALUES (?, ?, ?, ?, ?)',
      [userId, data.title, data.content, data.color || null, data.is_pinned ? 1 : 0]
    );
    return { id: result.insertId };
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    const allowed = ['title', 'content', 'color', 'is_pinned', 'status'];
    for (const key of allowed) {
      if (data[key] !== undefined) { fields.push(`${key} = ?`); values.push(data[key]); }
    }
    if (fields.length === 0) return { affectedRows: 0 };
    values.push(id);
    return db.update(`UPDATE notes SET ${fields.join(', ')} WHERE id = ?`, values);
  },

  async delete(id) {
    return db.update("UPDATE notes SET status = 'deleted' WHERE id = ?", [id]);
  },

  async isOwner(noteId, userId) {
    const n = await db.getOne('SELECT user_id FROM notes WHERE id = ?', [noteId]);
    return n && n.user_id === userId;
  },

  async search(userId, query) {
    return db.query(
      "SELECT * FROM notes WHERE user_id = ? AND status = 'active' AND (title LIKE ? OR content LIKE ?) ORDER BY updated_at DESC LIMIT 20",
      [userId, `%${query}%`, `%${query}%`]
    );
  }
};

module.exports = NoteModel;