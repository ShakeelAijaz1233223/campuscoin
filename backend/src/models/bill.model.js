const db = require('../config/database');

const BillModel = {
  async findById(id) {
    return db.getOne('SELECT b.*, c.name as category_name FROM bills b LEFT JOIN categories c ON b.category_id = c.id WHERE b.id = ?', [id]);
  },

  async findByUser(userId, { status = '', is_paid = '', page = 1, limit = 20 } = {}) {
    let where = ['b.user_id = ?'];
    if(!status)where.push("b.status != 'archived'");
    let params = [userId];
    if (status) { where.push('b.status = ?'); params.push(status); }
    if (is_paid !== '') { where.push('b.is_paid = ?'); params.push(parseInt(is_paid)); }
    const countResult = await db.getOne(`SELECT COUNT(*) as total FROM bills b WHERE ${where.join(' AND ')}`, params);
    const offset = (page - 1) * limit;
    const bills = await db.query(
      `SELECT b.*, c.name as category_name FROM bills b LEFT JOIN categories c ON b.category_id = c.id WHERE ${where.join(' AND ')} ORDER BY b.due_date ASC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    return { bills, total: countResult.total };
  },

  async create(data) {
    const result = await db.insert(
      'INSERT INTO bills (user_id, category_id, name, amount, due_date, frequency, reminder_days, auto_pay, notes, is_paid, paid_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [data.user_id, data.category_id || null, data.name, data.amount, data.due_date, data.frequency || 'monthly', data.reminder_days ?? 3, data.auto_pay ? 1 : 0, data.notes || null, data.is_paid ? 1 : 0, data.is_paid ? new Date().toISOString().slice(0,10) : null]
    );
    return { id: result.insertId };
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    const allowed = ['category_id', 'name', 'amount', 'due_date', 'frequency', 'is_paid', 'paid_date', 'reminder_days', 'auto_pay', 'notes', 'status'];
    for (const key of allowed) {
      if (data[key] !== undefined) { fields.push(`${key} = ?`); values.push(data[key]); }
    }
    if (fields.length === 0) return { affectedRows: 0 };
    values.push(id);
    return db.update(`UPDATE bills SET ${fields.join(', ')} WHERE id = ?`, values);
  },

  async markPaid(id) {
    return db.update("UPDATE bills SET is_paid = 1, paid_date = CURDATE() WHERE id = ?", [id]);
  },

  async markUnpaid(id) {
    return db.update("UPDATE bills SET is_paid = 0, paid_date = NULL WHERE id = ?", [id]);
  },

  async delete(id) {
    return db.update("UPDATE bills SET status = 'archived' WHERE id = ?", [id]);
  },

  async isOwner(billId, userId) {
    const b = await db.getOne('SELECT user_id FROM bills WHERE id = ?', [billId]);
    return b && b.user_id === userId;
  },

  async getUpcoming(userId, days = 7) {
    return db.query(
      `SELECT b.*, c.name as category_name FROM bills b LEFT JOIN categories c ON b.category_id = c.id
       WHERE b.user_id = ? AND b.is_paid = 0 AND b.status = 'active' AND b.due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
       ORDER BY b.due_date ASC`,
      [userId, days]
    );
  },

  async getOverdue(userId) {
    return db.query(
      `SELECT b.*, c.name as category_name FROM bills b LEFT JOIN categories c ON b.category_id = c.id
       WHERE b.user_id = ? AND b.is_paid = 0 AND b.status = 'active' AND b.due_date < CURDATE()
       ORDER BY b.due_date ASC`,
      [userId]
    );
  },

  async getDueForReminder(userId) {
    return db.query(
      `SELECT b.*, c.name as category_name FROM bills b LEFT JOIN categories c ON b.category_id = c.id
       WHERE b.user_id = ? AND b.is_paid = 0 AND b.status = 'active'
       AND b.due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL b.reminder_days DAY)`,
      [userId]
    );
  },

  async search(userId, query) {
    return db.query(
      `SELECT b.*, c.name as category_name FROM bills b LEFT JOIN categories c ON b.category_id = c.id
       WHERE b.user_id = ? AND b.status = 'active' AND b.name LIKE ? ORDER BY b.due_date ASC LIMIT 20`,
      [userId, `%${query}%`]
    );
  }
};

module.exports = BillModel;