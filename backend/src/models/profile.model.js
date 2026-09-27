const db = require('../config/database');

const ProfileModel = {
  async findByUserId(userId) {
    return db.getOne('SELECT * FROM profiles WHERE user_id = ?', [userId]);
  },

  async create(userId, data) {
    return db.insert(
      'INSERT INTO profiles (user_id, first_name, last_name, phone, academic_year, monthly_allowance, monthly_savings_goal) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, data.first_name, data.last_name || null, data.phone || null, data.academic_year || 'freshman', data.monthly_allowance || 0, data.monthly_savings_goal || 0]
    );
  },

  async update(userId, data) {
    const fields = [];
    const values = [];
    const allowed = ['first_name', 'last_name', 'phone', 'avatar_url', 'academic_year', 'monthly_allowance', 'monthly_savings_goal', 'currency', 'date_format', 'theme', 'language'];
    for (const key of allowed) {
      if (data[key] !== undefined) { fields.push(`${key} = ?`); values.push(data[key]); }
    }
    if (fields.length === 0) return { affectedRows: 0 };
    values.push(userId);
    return db.update(`UPDATE profiles SET ${fields.join(', ')} WHERE user_id = ?`, values);
  }
};

module.exports = ProfileModel;