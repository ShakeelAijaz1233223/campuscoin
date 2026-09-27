const db = require('../config/database');

const AiCorrectionModel = {
  async create(userId, description, originalCategoryId, correctedCategoryId) {
    const result = await db.insert(
      'INSERT INTO ai_correction_history (user_id, description, original_category_id, corrected_category_id) VALUES (?, ?, ?, ?)',
      [userId, description, originalCategoryId, correctedCategoryId]
    );
    return { id: result.insertId };
  },

  async findByUser(userId, { page = 1, limit = 20 } = {}) {
    const countResult = await db.getOne('SELECT COUNT(*) as total FROM ai_correction_history WHERE user_id = ?', [userId]);
    const offset = (page - 1) * limit;
    const records = await db.query(
      `SELECT ac.*, oc.name as original_name, cc.name as corrected_name
       FROM ai_correction_history ac
       LEFT JOIN categories oc ON ac.original_category_id = oc.id
       INNER JOIN categories cc ON ac.corrected_category_id = cc.id
       WHERE ac.user_id = ? ORDER BY ac.created_at DESC LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );
    return { records, total: countResult.total };
  },

  async findCorrectionsForDescription(userId, description) {
    return db.query(
      'SELECT corrected_category_id, COUNT(*) as count FROM ai_correction_history WHERE user_id = ? AND description LIKE ? GROUP BY corrected_category_id ORDER BY count DESC LIMIT 1',
      [userId, `%${description}%`]
    );
  },

  async createSuggestion(userId, description, suggestedCategoryId, confidence) {
    const result = await db.insert(
      'INSERT INTO ai_category_suggestions (user_id, description, suggested_category_id, confidence) VALUES (?, ?, ?, ?)',
      [userId, description, suggestedCategoryId, confidence]
    );
    return { id: result.insertId };
  },

  async updateSuggestion(id, accepted, correctedCategoryId = null) {
    return db.update(
      'UPDATE ai_category_suggestions SET accepted = ?, corrected_category_id = ? WHERE id = ?',
      [accepted ? 1 : 0, correctedCategoryId, id]
    );
  },

  async getSuggestionHistory(userId, { page = 1, limit = 20 } = {}) {
    const countResult = await db.getOne('SELECT COUNT(*) as total FROM ai_category_suggestions WHERE user_id = ?', [userId]);
    const offset = (page - 1) * limit;
    const records = await db.query(
      `SELECT as2.*, sc.name as suggested_name, cc.name as corrected_name
       FROM ai_category_suggestions as2
       LEFT JOIN categories sc ON as2.suggested_category_id = sc.id
       LEFT JOIN categories cc ON as2.corrected_category_id = cc.id
       WHERE as2.user_id = ? ORDER BY as2.created_at DESC LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );
    return { records, total: countResult.total };
  }
};

module.exports = AiCorrectionModel;