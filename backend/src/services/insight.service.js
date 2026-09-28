const InsightModel = require('../models/insight.model');
const TransactionModel = require('../models/transaction.model');
const BudgetModel = require('../models/budget.model');
const ProfileModel = require('../models/profile.model');
const NotificationModel = require('../models/notification.model');
const AnalyticsService = require('./analytics.service');
const { buildInsight } = require('../helpers/insightBuilder');
const { getCurrentMonth, getMonthRange } = require('../utils/dates');
const { largeThreshold, percentageChange } = require('../helpers/statistics');
const { NotFoundError, BadRequestError } = require('../utils/errors');

/**
 * Generate the AI monthly insight for a user + month.
 * AI provider is optional; the rule-based builder uses real MySQL analytics either way.
 * Output is advisory.
 */
const generateInsight = async (userId, month, year) => {
  const now = new Date();
  const m = parseInt(month) || now.getMonth() + 1;
  const y = parseInt(year) || now.getFullYear();
  if (m < 1 || m > 12)
    throw new BadRequestError('Month must be between 1 and 12');

  const { startDate, endDate } = getMonthRange(y, m);
  const prevDate = new Date(y, m - 2, 1);
  const prevRange = getMonthRange(
    prevDate.getFullYear(),
    prevDate.getMonth() + 1
  );

  const [
    income,
    expense,
    prevIncome,
    prevExpense,
    topCategories,
    categoryGrowth,
    profile,
    unusual
  ] = await Promise.all([
    TransactionModel.getTotalByType(userId, startDate, endDate, 'income'),
    TransactionModel.getTotalByType(userId, startDate, endDate, 'expense'),
    TransactionModel.getTotalByType(
      userId,
      prevRange.startDate,
      prevRange.endDate,
      'income'
    ),
    TransactionModel.getTotalByType(
      userId,
      prevRange.startDate,
      prevRange.endDate,
      'expense'
    ),
    TransactionModel.getCategorySpending(userId, startDate, endDate),
    TransactionModel.getCategorySpending(
      userId,
      prevRange.startDate,
      prevRange.endDate
    ),
    ProfileModel.findByUserId(userId),
    require('../config/database').query(
      "SELECT id, amount, description, date FROM transactions WHERE user_id = ? AND type = 'expense' AND status = 'active' AND date BETWEEN ? AND ?",
      [userId, startDate, endDate]
    )
  ]);

  await BudgetModel.recalculateSpent(userId, m, y);
  const budgets = await BudgetModel.findByUser(userId, m, y);
  const budgetStatus = budgets.map((b) => ({
    category_name: b.category_name,
    percentage:
      parseFloat(b.amount) > 0
        ? Math.round((parseFloat(b.spent) / parseFloat(b.amount)) * 100)
        : 0
  }));

  // Only flag transactions from this month as unusual
  const threshold =
    unusual.length >= 3
      ? largeThreshold(unusual.map((t) => Number(t.amount)))
      : null;
  const monthUnusual = threshold
    ? unusual.filter((t) => Number(t.amount) > threshold)
    : [];
  const previousCategories = new Map(
    categoryGrowth.map((c) => [c.category_id, Number(c.total)])
  );
  const selectedGrowth = topCategories.map((c) => ({
    ...c,
    change_percent: percentageChange(
      Number(c.total),
      previousCategories.get(c.category_id) || 0
    )
  }));

  const { total: transactionCount } = await TransactionModel.findByUser(
    userId,
    { page: 1, limit: 1, startDate, endDate }
  );

  const built = buildInsight({
    month: m,
    year: y,
    currency: profile?.currency || 'PKR',
    totalIncome: income,
    totalExpense: expense,
    previousIncome: prevIncome,
    previousExpense: prevExpense,
    topCategories,
    categoryGrowth: selectedGrowth,
    budgetStatus,
    transactionCount,
    unusualTransactions: monthUnusual,
    savingsGoal: parseFloat(profile?.monthly_savings_goal || 0)
  });

  await InsightModel.create({
    user_id: userId,
    month: m,
    year: y,
    summary: built.summary,
    tip: built.tip,
    metadata: built.metadata
  });

  await NotificationModel.create(
    userId,
    'ai_insight',
    'AI Insight Ready',
    `Your ${getMonthNameSafe(m)} ${y} financial insight is ready.`,
    { month: m, year: y }
  );

  return InsightModel.findByMonthYear(userId, m, y);
};

const getMonthNameSafe = (m) =>
  [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ][m - 1];

const getInsights = async (userId, filters) => {
  const { insights, total } = await InsightModel.findByUser(userId, filters);
  return { insights, total };
};

const getInsight = async (userId, id) => {
  const insight = await InsightModel.findById(id);
  if (!insight || insight.user_id !== userId)
    throw new NotFoundError('Insight not found');
  return insight;
};

const getInsightByMonth = async (userId, month, year) => {
  const insight = await InsightModel.findByMonthYear(userId, month, year);
  if (!insight)
    throw new NotFoundError(
      'No insight found for this month. Generate one first.'
    );
  return insight;
};

const getLatestInsight = async (userId) => {
  return InsightModel.getLatest(userId);
};

module.exports = {
  generateInsight,
  getInsights,
  getInsight,
  getInsightByMonth,
  getLatestInsight
};
