const RecurringModel = require('../models/recurring.model');
const AccountModel = require('../models/account.model');
const CategoryModel = require('../models/category.model');
const TransactionModel = require('../models/transaction.model');
const ActivityModel = require('../models/activity.model');
const { getNextOccurrence } = require('../utils/dates');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const db = require('../config/database');

const getRecurring = async (userId, filters) => {
  const { records, total } = await RecurringModel.findByUser(userId, filters);
  return { recurring: records, total };
};

const getRecurringById = async (userId, id) => {
  const record = await RecurringModel.findById(id);
  if (!record || record.user_id !== userId) throw new NotFoundError('Recurring transaction not found');
  return record;
};

const createRecurring = async (userId, data, ip = null) => {
  const account = await AccountModel.findById(data.account_id);
  if (!account || account.user_id !== userId) throw new BadRequestError('Invalid account');

  if (data.category_id) {
    const category = await CategoryModel.findById(data.category_id);
    if (!category || (category.user_id !== userId && category.is_default !== 1)) throw new BadRequestError('Invalid category');
    if (category.type !== data.type) throw new BadRequestError('Category type does not match transaction type');
  }

  if (data.end_date && new Date(data.end_date) < new Date(data.start_date)) {
    throw new BadRequestError('End date must be after start date');
  }

  data.next_occurrence = data.start_date;
  data.user_id = userId;
  const result = await RecurringModel.create(data);
  await ActivityModel.create(userId, 'created', 'recurring', result.id, `Created recurring ${data.type}: ${data.description || data.amount}`, null, ip);
  return RecurringModel.findById(result.id);
};

const updateRecurring = async (userId, id, data, ip = null) => {
  const record = await getRecurringById(userId, id);
  if(data.account_id){const a=await AccountModel.findById(data.account_id);if(!a||a.user_id!==userId)throw new BadRequestError('Invalid account');}
  if(data.end_date && data.end_date < record.start_date)throw new BadRequestError('End date must be after start date');

  const categoryId = data.category_id !== undefined ? data.category_id : record.category_id;
  if (categoryId) {
    const category = await CategoryModel.findById(categoryId);
    if (!category || (category.user_id !== userId && category.is_default !== 1)) throw new BadRequestError('Invalid category');
    if (category.type !== (data.type || record.type)) throw new BadRequestError('Category type does not match transaction type');
  }

  await RecurringModel.update(id, data);
  await ActivityModel.create(userId, 'updated', 'recurring', id, 'Updated recurring transaction', null, ip);
  return RecurringModel.findById(id);
};

const deleteRecurring = async (userId, id, ip = null) => {
  const record = await getRecurringById(userId, id);
  await RecurringModel.delete(id);
  await ActivityModel.create(userId, 'deleted', 'recurring', id, `Deleted recurring transaction: ${record.description || id}`, null, ip);
  return true;
};

const toggleRecurring = async (userId, id, isActive) => {
  await getRecurringById(userId, id);
  await RecurringModel.update(id, { is_active: isActive ? 1 : 0 });
  return RecurringModel.findById(id);
};

/**
 * Generate transactions for all due recurring rules.
 * Runs idempotently: checks for an existing transaction with the same
 * recurring_id and date before inserting (duplicate prevention).
 */
const processDueRecurring = async (userId = null) => {
  let due = await RecurringModel.getDueForGeneration();
  if (userId) due = due.filter((r) => r.user_id === userId);

  let generated = 0;
  let skipped = 0;

  for (const candidate of due) {
    const counts = await db.transaction(async conn => {
      const [rows] = await conn.execute('SELECT * FROM recurring_transactions WHERE id = ? FOR UPDATE', [candidate.id]);
      const rule = rows[0];
      if (!rule || !rule.is_active) return {generated:0,skipped:0};
      let nextDate = rule.next_occurrence;
      const today = new Date().toISOString().slice(0,10);
      let generated = 0, skipped = 0, guard = 0;
      while (nextDate <= today && (!rule.end_date || nextDate <= rule.end_date) && guard < 60) {
        const [existing] = await conn.execute('SELECT id FROM transactions WHERE recurring_id = ? AND date = ? LIMIT 1', [rule.id,nextDate]);
        if (!existing.length) {
          await conn.execute(
            `INSERT INTO transactions (user_id, account_id, category_id, recurring_id, type, amount, description, date)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [rule.user_id,rule.account_id,rule.category_id,rule.id,rule.type,rule.amount,rule.description || `Recurring ${rule.type}`,nextDate]
          );
          const delta = rule.type === 'income' ? Number(rule.amount) : -Number(rule.amount);
          await conn.execute('UPDATE accounts SET balance = balance + ? WHERE id = ?', [delta,rule.account_id]);
          generated++;
        } else skipped++;
        nextDate = getNextOccurrence(rule.frequency,nextDate);
        guard++;
      }
      await conn.execute('UPDATE recurring_transactions SET next_occurrence = ?, last_generated = ? WHERE id = ?', [nextDate,today,rule.id]);
      return {generated,skipped};
    });
    generated += counts.generated;
    skipped += counts.skipped;
  }

  return { generated, skipped, processed: due.length };
};

module.exports = { getRecurring, getRecurringById, createRecurring, updateRecurring, deleteRecurring, toggleRecurring, processDueRecurring };
