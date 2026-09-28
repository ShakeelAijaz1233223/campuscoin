const db = require('../config/database');

const UserModel = {
  async findById(id) {
    return db.getOne(
      'SELECT id, email, role, status, email_verified, last_login_at, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );
  },

  async findByEmail(email) {
    return db.getOne('SELECT * FROM users WHERE email = ?', [email]);
  },

  async create({ email, passwordHash, role = 'student' }) {
    return db.insert(
      'INSERT INTO users (email, password_hash, role, status) VALUES (?, ?, ?, ?)',
      [email, passwordHash, role, 'active']
    );
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    for (const [key, value] of Object.entries(data)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
    values.push(id);
    return db.update(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  },

  async updateLastLogin(id, ip) {
    return db.update(
      'UPDATE users SET last_login_at = NOW(), last_login_ip = ?, failed_login_attempts = 0 WHERE id = ?',
      [ip, id]
    );
  },

  async incrementFailedAttempts(id) {
    return db.update(
      'UPDATE users SET failed_login_attempts = failed_login_attempts + 1 WHERE id = ?',
      [id]
    );
  },

  async lockAccount(id, until) {
    return db.update('UPDATE users SET locked_until = ? WHERE id = ?', [
      until,
      id
    ]);
  },

  async setStatus(id, status) {
    return db.update(
      'UPDATE users SET status = ?, session_version = session_version + 1 WHERE id = ?',
      [status, id]
    );
  },

  async findAll({
    page = 1,
    limit = 20,
    search = '',
    status = '',
    role = ''
  } = {}) {
    let where = ['1=1'];
    let params = [];

    if (search) {
      where.push('(u.email LIKE ?)');
      params.push(`%${search}%`);
    }
    if (status) {
      where.push('u.status = ?');
      params.push(status);
    }
    if (role) {
      where.push('u.role = ?');
      params.push(role);
    }

    const countResult = await db.getOne(
      `SELECT COUNT(*) as total FROM users u WHERE ${where.join(' AND ')}`,
      params
    );
    const total = countResult.total;
    const offset = (page - 1) * limit;

    const users = await db.query(
      `SELECT u.id, u.email, u.role, u.status, u.last_login_at, u.created_at, p.first_name, p.last_name
       FROM users u LEFT JOIN profiles p ON u.id = p.user_id
       WHERE ${where.join(' AND ')} ORDER BY u.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return { users, total };
  },

  async count() {
    const result = await db.getOne('SELECT COUNT(*) as total FROM users');
    return result.total;
  },

  async countByStatus(status) {
    const result = await db.getOne(
      'SELECT COUNT(*) as total FROM users WHERE status = ?',
      [status]
    );
    return result.total;
  },

  async countByRole(role) {
    const result = await db.getOne(
      'SELECT COUNT(*) as total FROM users WHERE role = ?',
      [role]
    );
    return result.total;
  },

  async getActiveUsers(days = 30) {
    return db.query(
      'SELECT u.id, u.email, u.last_login_at, p.first_name, p.last_name FROM users u LEFT JOIN profiles p ON u.id = p.user_id WHERE u.last_login_at >= DATE_SUB(NOW(), INTERVAL ? DAY) ORDER BY u.last_login_at DESC',
      [days]
    );
  }
};

module.exports = UserModel;
