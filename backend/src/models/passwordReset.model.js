const db = require('../config/database');

const PasswordResetModel = {
  async create(userId, token, expiresAt) {
    return db.insert('INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)', [userId, token, expiresAt]);
  },

  async findValidToken(token) {
    return db.getOne('SELECT * FROM password_resets WHERE token = ? AND used = 0 AND expires_at > NOW()', [token]);
  },

  async markUsed(id) {
    return db.update('UPDATE password_resets SET used = 1 WHERE id = ?', [id]);
  },

  async deleteExpired() {
    return db.remove('DELETE FROM password_resets WHERE expires_at < NOW() OR used = 1');
  },

  async deleteByUserId(userId) {
    return db.remove('DELETE FROM password_resets WHERE user_id = ?', [userId]);
  }
};

module.exports = PasswordResetModel;