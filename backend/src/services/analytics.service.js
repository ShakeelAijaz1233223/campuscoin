const TransactionModel = require('../models/transaction.model');
const BudgetModel = require('../models/budget.model');
const AnalyticsModel = require('../models/analytics.model');
const { getCurrentMonth, getMonthRange, getLastNMonths, getMonthName } = require('../utils/dates');
const { round2, percentageChange, savingsRate, mean, linearForecast } = require('../helpers/statistics');

const getCategorySpending = async (userId, startDate, endDate) => {
  const rows = await TransactionModel.getCategorySpending(userId, startDate, endDate);
  const total = rows.reduce((s, r) => s + parseFloat(r.total), 0);
  return rows.map((r) => ({
    ...r,
    total: round2(parseFloat(r.total)),
    percentage: total > 0 ? round2((parseFloat(r.total) / total) * 100) : 0
  }));
};

const getDailySpending = async (userId, startDate, endDate) => {
  const rows = await TransactionModel.getDailySpending(userId, startDate, endDate);
  const byDate = {};
  for (const row of rows) {
    if (!byDate[row.date]) byDate[row.date] = { date: row.date, income: 0, expense: 0, count: 0 };
    byDate[row.date][row.type] = round2(parseFloat(row.total));
    byDate[row.date].count += row.count;
  }
  return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
};

const getWeeklySpending = async (userId, startDate, endDate) => {
  const rows = await TransactionModel.getWeeklySpending(userId, startDate, endDate);
  const byWeek = {};
  for (const row of rows) {
    const key = `${row.year}-W${String(row.week).padStart(2, '0')}`;
    if (!byWeek[key]) byWeek[key] = { week: key, income: 0, expense: 0, count: 0 };
    byWeek[key][row.type] = round2(parseFloat(row.total));
    byWeek[key].count += row.count;
  }
  return Object.values(byWeek);
};

const getMonthlySpending = async (userId, months = 12) => {
  const rows = await TransactionModel.getMonthlyTotals(userId, months);
  const byMonth = {};
  for (const row of rows) {
    const key = `${row.year}-${String(row.month).padStart(2, '0')}`;
    if (!byMonth[key]) byMonth[key] = { year: row.year, month: row.month, label: `${getMonthName(row.month).substring(0, 3)} ${row.year}`, income: 0, expense: 0, count: 0 };
    byMonth[key][row.type] = round2(parseFloat(row.total));
    byMonth[key].count += row.count;
  }
  return Object.values(byMonth).sort((a, b) => a.year - b.year || a.month - b.month);
};

const getSixMonthOverview = async (userId) => {
  const monthly = await getMonthlySpending(userId, 6);
  const income = monthly.reduce((s, m) => s + m.income, 0);
  const expense = monthly.reduce((s, m) => s + m.expense, 0);
  return {
    monthly,
    totals: {
      income: round2(income),
      expense: round2(expense),
      savings: round2(income - expense),
      avg_monthly_income: round2(mean(monthly.map((m) => m.income))),
      avg_monthly_expense: round2(mean(monthly.map((m) => m.expense)))
    }
  };
};

const getHistoricalAverages = async (userId, months = 6) => {
  const monthly = await getMonthlySpending(userId, months);
  return {
    avg_income: round2(mean(monthly.map((m) => m.income))),
    avg_expense: round2(mean(monthly.map((m) => m.expense))),
    avg_savings: round2(mean(monthly.map((m) => m.income - m.expense))),
    avg_savings_rate: savingsRate(mean(monthly.map((m) => m.income)), mean(monthly.map((m) => m.expense))),
    months_analyzed: monthly.length
  };
};

const getCategoryGrowth = async (userId, months = 2) => {
  const now = new Date();
  const currentRange = getMonthRange(now.getFullYear(), now.getMonth() + 1);
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevRange = getMonthRange(prevDate.getFullYear(), prevDate.getMonth() + 1);

  const [current, previous] = await Promise.all([
    TransactionModel.getCategorySpending(userId, currentRange.startDate, currentRange.endDate),
    TransactionModel.getCategorySpending(userId, prevRange.startDate, prevRange.endDate)
  ]);

  const prevMap = new Map(previous.map((p) => [p.category_id, parseFloat(p.total)]));
  return current.map((c) => {
    const prev = prevMap.get(c.category_id) || 0;
    return {
      category_id: c.category_id,
      category_name: c.category_name,
      current_total: round2(parseFloat(c.total)),
      previous_total: round2(prev),
      change_percent: round2(percentageChange(c.total, prev))
    };
  });
};

const getPersonalTrends = async (userId) => {
  const monthly = await getMonthlySpending(userId, 6);
  const expenses = monthly.map((m) => m.expense);
  const incomes = monthly.map((m) => m.income);
  const { month, year } = getCurrentMonth();
  const { startDate, endDate } = getMonthRange(year, month);
  const [curIncome, curExpense] = await Promise.all([
    TransactionModel.getTotalByType(userId, startDate, endDate, 'income'),
    TransactionModel.getTotalByType(userId, startDate, endDate, 'expense')
  ]);

  return {
    monthly_history: monthly,
    current_month: { income: round2(curIncome), expense: round2(curExpense) },
    expense_trend_forecast: linearForecast(expenses),
    income_trend_forecast: linearForecast(incomes),
    expense_change_vs_last: monthly.length >= 2 ? round2(percentageChange(curExpense, monthly[monthly.length - 2]?.expense || 0)) : 0
  };
};

const getBudgetConsumption = async (userId, month, year) => {
  const { month: curMonth, year: curYear } = getCurrentMonth();
  const m = parseInt(month) || curMonth;
  const y = parseInt(year) || curYear;
  await BudgetModel.recalculateSpent(userId, m, y);
  const budgets = await BudgetModel.findByUser(userId, m, y);
  return budgets.map((b) => ({
    category_name: b.category_name,
    budget: round2(parseFloat(b.amount)),
    spent: round2(parseFloat(b.spent)),
    consumption: b.amount > 0 ? round2((parseFloat(b.spent) / parseFloat(b.amount)) * 100) : 0
  }));
};

const getSavingsRate = async (userId, months = 6) => {
  const monthly = await getMonthlySpending(userId, months);
  return monthly.map((m) => ({
    ...m,
    savings: round2(m.income - m.expense),
    savings_rate: savingsRate(m.income, m.expense)
  }));
};

const snapshotMonth = async (userId, month, year) => {
  const { startDate, endDate } = getMonthRange(year, month);
  const [income, expense, categories, daily] = await Promise.all([
    TransactionModel.getTotalByType(userId, startDate, endDate, 'income'),
    TransactionModel.getTotalByType(userId, startDate, endDate, 'expense'),
    TransactionModel.getCategorySpending(userId, startDate, endDate),
    TransactionModel.getDailySpending(userId, startDate, endDate)
  ]);
  const top = categories[0] || null;
  const count = daily.reduce((s, d) => s + d.count, 0);
  return AnalyticsModel.upsert({
    user_id: userId, month, year,
    total_income: income, total_expense: expense,
    total_savings: round2(income - expense),
    top_category_id: top?.category_id || null,
    transaction_count: count,
    category_breakdown: categories.map((c) => ({ id: c.category_id, name: c.category_name, total: round2(parseFloat(c.total)) })),
    daily_breakdown: daily.map((d) => ({ date: d.date, type: d.type, total: round2(parseFloat(d.total)) }))
  });
};

module.exports = {
  getCategorySpending, getDailySpending, getWeeklySpending, getMonthlySpending,
  getSixMonthOverview, getHistoricalAverages, getCategoryGrowth, getPersonalTrends,
  getBudgetConsumption, getSavingsRate, snapshotMonth
};
