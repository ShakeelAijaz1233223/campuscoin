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
const {
  NotFoundError,
  BadRequestError,
  ForbiddenError
} = require('../utils/errors');
const db = require('../config/database');
const { NEAR_LIMIT_THRESHOLD } = require('../utils/constants');

const assertOwnership = async (transactionId, userId) => {
  const transaction = await TransactionModel.findById(transactionId);
  if (
    !transaction ||
    transaction.user_id !== userId ||
    transaction.status === 'deleted'
  )
    throw new NotFoundError('Transaction not found');
  return transaction;
};

const validateAccountAndCategory = async (
  userId,
  accountId,
  categoryId,
  type,
  connection
) => {
  const one = async (sql, params) =>
    (await connection.execute(sql, params))[0][0];
  const account = connection
    ? await one('SELECT * FROM accounts WHERE id = ?', [accountId])
    : await AccountModel.findById(accountId);
  if (!account || account.user_id !== userId || account.status !== 'active')
    throw new BadRequestError('Invalid or inactive account');

  if (categoryId) {
    const category = connection
      ? await one('SELECT * FROM categories WHERE id = ?', [categoryId])
      : await CategoryModel.findById(categoryId);
    if (
      !category ||
      (category.user_id !== userId && category.is_default !== 1)
    ) {
      throw new BadRequestError('Invalid category');
    }
    if (category.status !== 'active')
      throw new BadRequestError('Category is inactive');
    if (category.type !== type) {
      throw new BadRequestError(
        `Category "${category.name}" is a ${category.type} category but the transaction type is ${type}`
      );
    }
  }
  return account;
};

const getSuggestion = async (userId, description, type) => {
  try {
    const categories = await CategoryModel.findByUser(userId, { type });
    const provider = getAIProvider();
    const suggestion = await provider.categorize(description, categories);

    if (suggestion.categoryId) {
      // Check correction history for user-learned preference first
      const learned = await AiCorrectionModel.findCorrectionsForDescription(
        userId,
        description
      );
      if (learned.length > 0) {
        const learnedCat = categories.find(
          (c) => c.id === learned[0].corrected_category_id
        );
        if (learnedCat) {
          return {
            categoryId: learnedCat.id,
            categoryName: learnedCat.name,
            confidence: 0.99,
            explanation:
              'Based on your previous corrections for similar transactions',
            learned: true
          };
        }
      }
      await AiCorrectionModel.createSuggestion(
        userId,
        description,
        suggestion.categoryId,
        suggestion.confidence
      );
    }
    return suggestion;
  } catch (err) {
    // AI is optional: never block transaction creation on AI failure
    return {
      categoryId: null,
      categoryName: null,
      confidence: 0,
      explanation: 'AI suggestion unavailable',
      error: true
    };
  }
};

const applyBudgetEffects = async (userId, transaction) => {
  if (transaction.type !== 'expense' || !transaction.category_id) return;
  const [year, month] = String(transaction.date)
    .slice(0, 7)
    .split('-')
    .map(Number);
  const { startDate, endDate } = getMonthRange(year, month);
  const current = getCurrentMonth();
  const alert = await db.transaction(async (conn) => {
    const [budgets] = await conn.execute(
      "SELECT b.*, c.name AS category_name FROM budgets b JOIN categories c ON c.id = b.category_id WHERE b.user_id = ? AND b.category_id = ? AND b.month = ? AND b.year = ? AND b.status = 'active' FOR UPDATE",
      [userId, transaction.category_id, month, year]
    );
    const budget = budgets[0];
    if (!budget) return null;
    // Recalculate from the ledger, not a stale read-modify-write delta.
    const [totals] = await conn.execute(
      "SELECT COALESCE(SUM(amount),0) AS spent FROM transactions WHERE user_id = ? AND category_id = ? AND type = 'expense' AND status = 'active' AND date BETWEEN ? AND ?",
      [userId, transaction.category_id, startDate, endDate]
    );
    const spent = Number(totals[0].spent);
    await conn.execute('UPDATE budgets SET spent = ? WHERE id = ?', [
      spent,
      budget.id
    ]);
    const before = Number(budget.spent) / Number(budget.amount);
    const after = spent / Number(budget.amount);
    if (month !== current.month || year !== current.year) return null;
    const type =
      before < 1 && after >= 1
        ? 'budget_exceeded'
        : before < NEAR_LIMIT_THRESHOLD &&
            after >= NEAR_LIMIT_THRESHOLD &&
            after < 1
          ? 'budget_alert'
          : null;
    return type ? { type, budget, percentage: Math.round(after * 100) } : null;
  });
  if (alert)
    await NotificationModel.create(
      userId,
      alert.type,
      alert.type === 'budget_exceeded'
        ? 'Budget Exceeded'
        : 'Budget Near Limit',
      `${alert.budget.category_name}: ${alert.percentage}% of your budget used.`,
      { budget_id: alert.budget.id, percentage: alert.percentage }
    );
};

const getTransactions = async (userId, filters) => {
  const { transactions, total } = await TransactionModel.findByUser(
    userId,
    filters
  );

  // Enrich with duplicates flag for AI/duplicate detection insight
  const income = transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + parseFloat(t.amount), 0);
  const expense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + parseFloat(t.amount), 0);

  return { transactions, total, summary: { income, expense, count: total } };
};

const getTransaction = async (userId, transactionId) => {
  return assertOwnership(transactionId, userId);
};

const createTransaction = async (userId, data, ip = null) => {
  const account = await validateAccountAndCategory(
    userId,
    data.account_id,
    data.category_id,
    data.type
  );

  // Duplicate detection (advisory, non-blocking)
  let duplicateWarning = null;
  const duplicates = await findExistingDuplicates(userId, {
    description: data.description || '',
    amount: data.amount,
    date: data.date
  });
  if (duplicates.length > 0) {
    duplicateWarning = {
      message: 'A similar transaction already exists within the last 24 hours',
      duplicates: duplicates.map((d) => ({
        id: d.id,
        date: d.date,
        amount: d.amount
      }))
    };
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
      [
        userId,
        data.account_id,
        data.category_id || null,
        null,
        null,
        data.type,
        data.amount,
        data.description || '',
        data.notes || null,
        data.date,
        data.ai_suggested_category_id || null,
        data.ai_confidence || null,
        data.ai_overridden ? 1 : 0,
        duplicates.length > 0 ? 1 : 0
      ]
    );
    const txId = r.insertId;

    // Update account balance
    const delta =
      data.type === 'income'
        ? parseFloat(data.amount)
        : -parseFloat(data.amount);
    await conn.execute(
      'UPDATE accounts SET balance = balance + ? WHERE id = ?',
      [delta, account.id]
    );

    return txId;
  });

  const transaction = await TransactionModel.findById(result);
  await applyBudgetEffects(userId, transaction, 'add');
  await ActivityModel.create(
    userId,
    'created',
    'transaction',
    result,
    `Created ${data.type} transaction: ${data.description || data.amount}`,
    null,
    ip
  );

  return { transaction, duplicateWarning, aiSuggestion };
};

const lockTransaction = async (conn, userId, transactionId) => {
  const [rows] = await conn.execute(
    "SELECT * FROM transactions WHERE id = ? AND user_id = ? AND status = 'active' FOR UPDATE",
    [transactionId, userId]
  );
  if (!rows.length) throw new NotFoundError('Transaction not found');
  return rows[0];
};

const updateTransaction = async (userId, transactionId, data, ip = null) => {
  const existing = await db.transaction(async (conn) => {
    // Concurrent edits/deletes must reverse the latest committed value exactly once.
    const old = await lockTransaction(conn, userId, transactionId);
    const categoryId =
      data.category_id !== undefined ? data.category_id : old.category_id;
    const type = data.type || old.type;
    const accountId = data.account_id || old.account_id;

    if (
      data.category_id !== undefined &&
      Number(data.category_id) !== old.category_id
    )
      data.ai_overridden = 1;
    // Consistent account lock order avoids deadlocks when edits swap accounts.
    await conn.execute(
      'SELECT id FROM accounts WHERE id IN (?, ?) ORDER BY id FOR UPDATE',
      [old.account_id, accountId]
    );
    await validateAccountAndCategory(userId, accountId, categoryId, type, conn);
    const oldDelta =
      old.type === 'income' ? -Number(old.amount) : Number(old.amount);
    const amount =
      data.amount !== undefined ? Number(data.amount) : Number(old.amount);
    await conn.execute(
      'UPDATE accounts SET balance = balance + ? WHERE id = ?',
      [oldDelta, old.account_id]
    );
    await conn.execute(
      'UPDATE accounts SET balance = balance + ? WHERE id = ?',
      [type === 'income' ? amount : -amount, accountId]
    );
    const allowed = [
      'account_id',
      'category_id',
      'type',
      'amount',
      'description',
      'notes',
      'date',
      'ai_overridden'
    ];
    const keys = allowed.filter((key) => data[key] !== undefined);
    if (keys.length)
      await conn.execute(
        `UPDATE transactions SET ${keys.map((key) => `${key} = ?`).join(', ')} WHERE id = ?`,
        [...keys.map((key) => data[key]), transactionId]
      );
    return old;
  });
  await applyBudgetEffects(userId, existing);
  const updated = await TransactionModel.findById(transactionId);
  await applyBudgetEffects(userId, updated);
  await ActivityModel.create(
    userId,
    'updated',
    'transaction',
    transactionId,
    `Updated transaction: ${updated.description || updated.id}`,
    null,
    ip
  );
  return { transaction: updated };
};

const deleteTransaction = async (userId, transactionId, ip = null) => {
  const existing = await db.transaction(async (conn) => {
    const old = await lockTransaction(conn, userId, transactionId);
    await conn.execute(
      "UPDATE transactions SET status = 'deleted' WHERE id = ?",
      [transactionId]
    );
    const delta =
      old.type === 'income' ? -Number(old.amount) : Number(old.amount);
    await conn.execute(
      'UPDATE accounts SET balance = balance + ? WHERE id = ?',
      [delta, old.account_id]
    );
    return old;
  });
  await applyBudgetEffects(userId, existing);
  await ActivityModel.create(
    userId,
    'deleted',
    'transaction',
    transactionId,
    `Deleted transaction: ${existing.description || existing.id}`,
    null,
    ip
  );
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
    (
      await db.query(
        "SELECT amount FROM transactions WHERE user_id = ? AND type = 'expense' AND status = 'active' ORDER BY date DESC LIMIT 100",
        [userId]
      )
    ).map((r) => parseFloat(r.amount))
  );
  if (!threshold) return [];
  return TransactionModel.getUnusuallyLarge(userId, threshold);
};

const recordView = async (userId, transactionId) => {
  await assertOwnership(transactionId, userId);
  await ActivityModel.create(
    userId,
    'viewed',
    'transaction',
    transactionId,
    'Viewed transaction'
  );
  return true;
};

module.exports = {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  applyBudgetEffects,
  getSuggestion,
  getRecentlyViewed,
  getRecentlyEdited,
  getUnusuallyLarge,
  recordView,
  assertOwnership
};
