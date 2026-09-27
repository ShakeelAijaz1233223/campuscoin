const TransactionModel = require('../models/transaction.model');
const AccountModel = require('../models/account.model');
const CategoryModel = require('../models/category.model');
const BudgetModel = require('../models/budget.model');
const ActivityModel = require('../models/activity.model');
const NotificationModel = require('../models/notification.model');
const AiCorrectionModel = require('../models/aiCorrection.model');
const { getAIProvider } = require('../config/ai');
const { findExistingDuplicates } = require('../helpers/duplicateDetector');
const { largeThreshold } = require('../helpers/statistics');
const { getCurrentMonth, getMonthRange } = require('../utils/dates');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../utils/errors');
const db = require('../config/database');
const { NEAR_LIMIT_THRESHOLD } = require('../utils/constants');

const assertOwnership = async (transactionId, userId) => {
  const transaction = await TransactionModel.findById(transactionId);
  if (!transaction || transaction.user_id !== userId || transaction.status === 'deleted') throw new NotFoundError('Transaction not found');
  return transaction;
};

const validateAccountAndCategory = async (userId, accountId, categoryId, type) => {
  const account = await AccountModel.findById(accountId);
  if (!account || account.user_id !== userId) throw new BadRequestError('Invalid account');

  if (categoryId) {
    const category = await CategoryModel.findById(categoryId);
    if (!category || (category.user_id !== userId && category.is_default !== 1)) {
      throw new BadRequestError('Invalid category');
    }
    if (category.status !== 'active') throw new BadRequestError('Category is inactive');
    if (category.type !== type) {
      throw new BadRequestError(`Category "${category.name}" is a ${category.type} category but the transaction type is ${type}`);
    }
  }
  return account;
};

const getSuggestion = async (userId, description, type) => {
  try {
    const categories = await CategoryModel.findByUser(userId, { type });
    const provider = getAIProvider();
    const suggestion = provider.categorize(description, categories);

    if (suggestion.categoryId) {
      // Check correction history for user-learned preference first
      const learned = await AiCorrectionModel.findCorrectionsForDescription(userId, description);
      if (learned.length > 0) {
        const learnedCat = categories.find((c) => c.id === learned[0].corrected_category_id);
        if (learnedCat) {
          return { categoryId: learnedCat.id, categoryName: learnedCat.name, confidence: 0.99, explanation: 'Based on your previous corrections for similar transactions', learned: true };
        }
      }
      await AiCorrectionModel.createSuggestion(userId, description, suggestion.categoryId, suggestion.confidence);
    }
    return suggestion;
  } catch (err) {
    // AI is optional: never block transaction creation on AI failure
    return { categoryId: null, categoryName: null, confidence: 0, explanation: 'AI suggestion unavailable', error: true };
  }
};

const applyBudgetEffects = async (userId, transaction, direction = 'add') => {
  // Only expenses in the current month affect budgets/alerts
  if (transaction.type !== 'expense' || !transaction.category_id) return;

  const date = new Date(transaction.date);
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const { month: curMonth, year: curYear } = getCurrentMonth();
  if (month !== curMonth || year !== curYear) return;

  const budget = await BudgetModel.findByUserAndCategory(userId, transaction.category_id, month, year);
  if (!budget) return;

  const delta = direction === 'add' ? parseFloat(transaction.amount) : -parseFloat(transaction.amount);
  const newSpent = Math.max(0, parseFloat(budget.spent) + delta);
  await BudgetModel.updateSpent(budget.id, newSpent);

  const pct = budget.amount > 0 ? (newSpent / parseFloat(budget.amount)) : 0;
  const alreadyExceededNotified = pct < 1 && parseFloat(budget.spent) >= parseFloat(budget.amount);

  if (pct >= 1 && !alreadyExceededNotified) {
    await NotificationModel.create(userId, 'budget_exceeded', 'Budget Exceeded',
      `Your ${budget.category_name} budget of has been exceeded. Spent ${newSpent} of ${budget.amount}.`,
      { budget_id: budget.id, category: budget.category_name, percentage: Math.round(pct * 100) });
  } else if (pct >= NEAR_LIMIT_THRESHOLD && pct < 1) {
    await NotificationModel.create(userId, 'budget_alert', 'Budget Near Limit',
      `Your ${budget.category_name} budget is ${Math.round(pct * 100)}% used.`,
      { budget_id: budget.id, category: budget.category_name, percentage: Math.round(pct * 100) });
  }
};

const getTransactions = async (userId, filters) => {
  const { transactions, total } = await TransactionModel.findByUser(userId, filters);

  // Enrich with duplicates flag for AI/duplicate detection insight
  const income = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0);
  const expense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0);

  return { transactions, total, summary: { income, expense, count: total } };
};

const getTransaction = async (userId, transactionId) => {
  return assertOwnership(transactionId, userId);
};

const createTransaction = async (userId, data, ip = null) => {
  const account = await validateAccountAndCategory(userId, data.account_id, data.category_id, data.type);

  // Duplicate detection (advisory, non-blocking)
  let duplicateWarning = null;
  const duplicates = await findExistingDuplicates(userId, {
    description: data.description || '',
    amount: data.amount,
    date: data.date
  });
  if (duplicates.length > 0) {
    duplicateWarning = { message: 'A similar transaction already exists within the last 24 hours', duplicates: duplicates.map((d) => ({ id: d.id, date: d.date, amount: d.amount })) };
  }

  // AI suggestion if requested and no explicit category given
  let aiSuggestion = null;
  if (data.use_ai && !data.category_id && data.description) {
    aiSuggestion = await getSuggestion(userId, data.description, data.type);
    if (aiSuggestion.categoryId && data.accept_ai !== false) {
      data.category_id = aiSuggestion.categoryId;
      data.ai_suggested_category_id = aiSuggestion.categoryId;
      data.ai_confidence = aiSuggestion.confidence;
    }
  }

  const result = await db.transaction(async (conn) => {
    const [r] = await conn.execute(
      `INSERT INTO transactions (user_id, account_id, category_id, recurring_id, import_id, type, amount, description, notes, date, ai_suggested_category_id, ai_confidence, ai_overridden, is_duplicate)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, data.account_id, data.category_id || null, data.recurring_id || null, data.import_id || null,
       data.type, data.amount, data.description || '', data.notes || null, data.date,
       data.ai_suggested_category_id || null, data.ai_confidence || null, data.ai_overridden ? 1 : 0,
       duplicates.length > 0 ? 1 : 0]
    );
    const txId = r.insertId;

    // Update account balance
    const delta = data.type === 'income' ? parseFloat(data.amount) : -parseFloat(data.amount);
    await conn.execute('UPDATE accounts SET balance = balance + ? WHERE id = ?', [delta, account.id]);

    return txId;
  });

  const transaction = await TransactionModel.findById(result);
  await applyBudgetEffects(userId, transaction, 'add');
  await ActivityModel.create(userId, 'created', 'transaction', result, `Created ${data.type} transaction: ${data.description || data.amount}`, null, ip);

  return { transaction, duplicateWarning, aiSuggestion };
};

const updateTransaction = async (userId, transactionId, data, ip = null) => {
  const existing = await assertOwnership(transactionId, userId);

  if (data.category_id) {
    const category = await CategoryModel.findById(data.category_id);
    if (!category || (category.user_id !== userId && category.is_default !== 1)) throw new BadRequestError('Invalid category');
    if (category.type !== (data.type || existing.type)) throw new BadRequestError('Category type does not match transaction type');
    if (data.category_id !== existing.category_id) data.ai_overridden = 1;
  }

  if (data.account_id) {
    const account = await AccountModel.findById(data.account_id);
    if (!account || account.user_id !== userId) throw new BadRequestError('Invalid account');
  }

  await db.transaction(async (conn) => {
    // Reverse old balance effect
    const oldDelta = existing.type === 'income' ? -parseFloat(existing.amount) : parseFloat(existing.amount);
    await conn.execute('UPDATE accounts SET balance = balance + ? WHERE id = ?', [oldDelta, existing.account_id]);

    // Apply new balance effect if account/type/amount changes
    const newType = data.type || existing.type;
    const newAmount = data.amount !== undefined ? parseFloat(data.amount) : parseFloat(existing.amount);
    const newAccountId = data.account_id || existing.account_id;
    const newDelta = newType === 'income' ? newAmount : -newAmount;
    await conn.execute('UPDATE accounts SET balance = balance + ? WHERE id = ?', [newDelta, newAccountId]);

    const fields = [];
    const values = [];
    const allowed = ['account_id', 'category_id', 'type', 'amount', 'description', 'notes', 'date', 'ai_overridden'];
    for (const key of allowed) {
      if (data[key] !== undefined) { fields.push(`${key} = ?`); values.push(data[key]); }
    }
    if (fields.length > 0) {
      values.push(transactionId);
      await conn.execute(`UPDATE transactions SET ${fields.join(', ')} WHERE id = ?`, values);
    }
  });

  // Reverse old budget effect and apply new one
  await applyBudgetEffects(userId, existing, 'remove');
  const updated = await TransactionModel.findById(transactionId);
  await applyBudgetEffects(userId, updated, 'add');

  await ActivityModel.create(userId, 'updated', 'transaction', transactionId, `Updated transaction: ${updated.description || updated.id}`, null, ip);
  return { transaction: updated };
};

const deleteTransaction = async (userId, transactionId, ip = null) => {
  const existing = await assertOwnership(transactionId, userId);

  await db.transaction(async (conn) => {
    await conn.execute("UPDATE transactions SET status = 'deleted' WHERE id = ?", [transactionId]);
    const delta = existing.type === 'income' ? -parseFloat(existing.amount) : parseFloat(existing.amount);
    await conn.execute('UPDATE accounts SET balance = balance + ? WHERE id = ?', [delta, existing.account_id]);
  });

  await applyBudgetEffects(userId, existing, 'remove');
  await ActivityModel.create(userId, 'deleted', 'transaction', transactionId, `Deleted transaction: ${existing.description || existing.id}`, null, ip);
  return true;
};

const getRecentlyViewed = async (userId) => {
  const rows = await db.query(
    "SELECT t.id, t.description, t.amount, t.type, t.date, a.created_at as viewed_at FROM activities a INNER JOIN transactions t ON a.entity_id = t.id WHERE a.user_id = ? AND a.entity_type = 'transaction' AND a.action = 'viewed' AND t.status = 'active' GROUP BY t.id, a.created_at ORDER BY a.created_at DESC LIMIT 10",
    [userId]
  );
  return rows;
};

const getRecentlyEdited = async (userId) => {
  const rows = await db.query(
    "SELECT t.id, t.description, t.amount, t.type, t.date, MAX(a.created_at) as edited_at FROM activities a INNER JOIN transactions t ON a.entity_id = t.id WHERE a.user_id = ? AND a.entity_type = 'transaction' AND a.action = 'updated' AND t.status = 'active' GROUP BY t.id ORDER BY edited_at DESC LIMIT 10",
    [userId]
  );
  return rows;
};

const getUnusuallyLarge = async (userId) => {
  const stats = await db.getOne(
    "SELECT AVG(amount) as avg_amount, COUNT(*) as cnt FROM transactions WHERE user_id = ? AND type = 'expense' AND status = 'active'",
    [userId]
  );
  if (!stats.cnt || stats.cnt < 3) return [];
  const threshold = largeThreshold(
    (await db.query("SELECT amount FROM transactions WHERE user_id = ? AND type = 'expense' AND status = 'active' ORDER BY date DESC LIMIT 100", [userId])).map((r) => parseFloat(r.amount))
  );
  if (!threshold) return [];
  return TransactionModel.getUnusuallyLarge(userId, threshold);
};

const recordView = async (userId, transactionId) => {
  await assertOwnership(transactionId, userId);
  await ActivityModel.create(userId, 'viewed', 'transaction', transactionId, 'Viewed transaction');
  return true;
};

module.exports = {
  getTransactions, getTransaction, createTransaction, updateTransaction, deleteTransaction,
  applyBudgetEffects, getSuggestion, getRecentlyViewed, getRecentlyEdited, getUnusuallyLarge, recordView, assertOwnership
};
