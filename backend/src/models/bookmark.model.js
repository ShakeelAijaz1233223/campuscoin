const db = require('../config/database');

const BookmarkModel = {
  // Tip bookmarks
  async findTipBookmark(userId, tipId) {
    return db.getOne('SELECT * FROM tip_bookmarks WHERE user_id = ? AND tip_id = ?', [userId, tipId]);
  },

  async createTipBookmark(userId, tipId) {
    const result = await db.insert('INSERT INTO tip_bookmarks (user_id, tip_id) VALUES (?, ?)', [userId, tipId]);
    return { id: result.insertId };
  },

  async deleteTipBookmark(userId, tipId) {
    return db.remove('DELETE FROM tip_bookmarks WHERE user_id = ? AND tip_id = ?', [userId, tipId]);
  },

  async getTipBookmarks(userId, { page = 1, limit = 20 } = {}) {
    const countResult = await db.getOne('SELECT COUNT(*) as total FROM tip_bookmarks WHERE user_id = ?', [userId]);
    const offset = (page - 1) * limit;
    const bookmarks = await db.query(
      `SELECT tb.*, t.title, t.content, t.category FROM tip_bookmarks tb
       INNER JOIN tips t ON tb.tip_id = t.id WHERE tb.user_id = ?
       ORDER BY tb.created_at DESC LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );
    return { bookmarks, total: countResult.total };
  },

  // Insight bookmarks
  async findInsightBookmark(userId, insightId) {
    return db.getOne('SELECT * FROM insight_bookmarks WHERE user_id = ? AND insight_id = ?', [userId, insightId]);
  },

  async createInsightBookmark(userId, insightId) {
    const result = await db.insert('INSERT INTO insight_bookmarks (user_id, insight_id) VALUES (?, ?)', [userId, insightId]);
    return { id: result.insertId };
  },

  async deleteInsightBookmark(userId, insightId) {
    return db.remove('DELETE FROM insight_bookmarks WHERE user_id = ? AND insight_id = ?', [userId, insightId]);
  },

  async getInsightBookmarks(userId, { page = 1, limit = 20 } = {}) {
    const countResult = await db.getOne('SELECT COUNT(*) as total FROM insight_bookmarks WHERE user_id = ?', [userId]);
    const offset = (page - 1) * limit;
    const bookmarks = await db.query(
      `SELECT ib.*, i.month, i.year, i.summary, i.tip FROM insight_bookmarks ib
       INNER JOIN insights i ON ib.insight_id = i.id WHERE ib.user_id = ?
       ORDER BY ib.created_at DESC LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );
    return { bookmarks, total: countResult.total };
  }
};

module.exports = BookmarkModel;