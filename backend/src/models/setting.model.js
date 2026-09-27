const db = require('../config/database');

const SettingModel = {
  async get(userId, key) {
    const row = await db.getOne('SELECT * FROM settings WHERE user_id = ? AND setting_key = ?', [userId, key]);
    return row ? row.setting_value : null;
  },

  async set(userId, key, value) {
    const existing = await db.getOne('SELECT id FROM settings WHERE user_id = ? AND setting_key = ?', [userId, key]);
    if (existing) {
      await db.update('UPDATE settings SET setting_value = ? WHERE user_id = ? AND setting_key = ?', [value, userId, key]);
      return { id: existing.id, updated: true };
    }
    const result = await db.insert('INSERT INTO settings (user_id, setting_key, setting_value) VALUES (?, ?, ?)', [userId, key, value]);
    return { id: result.insertId, updated: false };
  },

  async getAll(userId) {
    return db.query('SELECT setting_key, setting_value, updated_at FROM settings WHERE user_id = ?', [userId]);
  },

  async delete(userId, key) {
    return db.remove('DELETE FROM settings WHERE user_id = ? AND setting_key = ?', [userId, key]);
  },

  async setMany(userId, settingsObj) {
    for (const [key, value] of Object.entries(settingsObj)) {
      await this.set(userId, key, typeof value === 'object' ? JSON.stringify(value) : String(value));
    }
    return this.getAll(userId);
  }
};

module.exports = SettingModel;