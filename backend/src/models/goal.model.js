const db = require('../config/database');
const { NotFoundError, BadRequestError } = require('../utils/errors');

const GoalModel = {
  async findById(id) {
    return db.getOne('SELECT * FROM goals WHERE id = ?', [id]);
  },

  async findByUser(userId, { status = '', page = 1, limit = 20 } = {}) {
    let where = ['user_id = ?'];
    if (!status) where.push("status != 'cancelled'");
    let params = [userId];
    if (status) {
      where.push('status = ?');
      params.push(status);
    }
    const countResult = await db.getOne(
      `SELECT COUNT(*) as total FROM goals WHERE ${where.join(' AND ')}`,
      params
    );
    const offset = (page - 1) * limit;
    const goals = await db.query(
      `SELECT * FROM goals WHERE ${where.join(' AND ')} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    return { goals, total: countResult.total };
  },

  async create(data) {
    const result = await db.insert(
      'INSERT INTO goals (user_id, name, description, target_amount, target_date, icon, color, current_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        data.user_id,
        data.name,
        data.description || null,
        data.target_amount,
        data.target_date || null,
        data.icon || null,
        data.color || null,
        data.current_amount || 0
      ]
    );
    return { id: result.insertId };
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    const allowed = [
      'name',
      'description',
      'target_amount',
      'target_date',
      'icon',
      'color',
      'status',
      'current_amount',
      'completed_at'
    ];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    }
    if (fields.length === 0) return { affectedRows: 0 };
    values.push(id);
    return db.update(
      `UPDATE goals SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  },

  async delete(id) {
    return db.update("UPDATE goals SET status = 'cancelled' WHERE id = ?", [
      id
    ]);
  },

  async isOwner(goalId, userId) {
    const g = await db.getOne('SELECT user_id FROM goals WHERE id = ?', [
      goalId
    ]);
    return g && g.user_id === userId;
  },

  async addContribution(goalId, userId, amount, date, notes) {
    return db.transaction(async (conn) => {
      const [rows] = await conn.execute(
        'SELECT * FROM goals WHERE id = ? AND user_id = ? FOR UPDATE',
        [goalId, userId]
      );
      const before = rows[0];
      if (!before) throw new NotFoundError('Goal not found');
      if (before.status !== 'active')
        throw new BadRequestError(
          'Contributions can only be made to active goals'
        );
      const [result] = await conn.execute(
        'INSERT INTO goal_contributions (goal_id, user_id, amount, date, notes) VALUES (?, ?, ?, ?, ?)',
        [goalId, userId, amount, date, notes || null]
      );
      await conn.execute(
        'UPDATE goals SET current_amount = current_amount + ? WHERE id = ?',
        [amount, goalId]
      );
      await conn.execute(
        "UPDATE goals SET status = 'completed', completed_at = NOW() WHERE id = ? AND current_amount >= target_amount",
        [goalId]
      );
      const [updated] = await conn.execute('SELECT * FROM goals WHERE id = ?', [
        goalId
      ]);
      return { id: result.insertId, goal: updated[0], before };
    });
  },

  async getContributions(goalId, userId) {
    return db.query(
      'SELECT * FROM goal_contributions WHERE goal_id = ? AND user_id = ? ORDER BY date DESC',
      [goalId, userId]
    );
  },

  async removeContribution(contributionId, goalId, userId) {
    return db.transaction(async (conn) => {
      // Same goal-first lock order as contribution creation.
      await conn.execute(
        'SELECT id FROM goals WHERE id = ? AND user_id = ? FOR UPDATE',
        [goalId, userId]
      );
      const [rows] = await conn.execute(
        'SELECT * FROM goal_contributions WHERE id = ? AND goal_id = ? AND user_id = ? FOR UPDATE',
        [contributionId, goalId, userId]
      );
      if (!rows.length) throw new NotFoundError('Contribution not found');
      const contrib = rows[0];
      await conn.execute(
        'UPDATE goals SET current_amount = GREATEST(0, current_amount - ?) WHERE id = ?',
        [contrib.amount, goalId]
      );
      await conn.execute(
        "UPDATE goals SET status = 'active', completed_at = NULL WHERE id = ? AND status = 'completed' AND current_amount < target_amount",
        [goalId]
      );
      await conn.execute('DELETE FROM goal_contributions WHERE id = ?', [
        contributionId
      ]);
      return contrib;
    });
  },

  async count(userId) {
    const result = await db.getOne(
      "SELECT COUNT(*) as total FROM goals WHERE user_id = ? AND status = 'active'",
      [userId]
    );
    return result.total;
  }
};

module.exports = GoalModel;
