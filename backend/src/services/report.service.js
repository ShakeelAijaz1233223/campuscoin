const TransactionModel = require('../models/transaction.model');
const BudgetModel = require('../models/budget.model');
const { buildMonthlyReportPDF, buildRangeReportPDF } = require('../helpers/reportBuilder');
const { getMonthRange, getMonthName } = require('../utils/dates');
const { round2, mean } = require('../helpers/statistics');
const ProfileModel = require('../models/profile.model');
const UserModel = require('../models/user.model');
const fs = require('fs');
const path = require('path');

const REPORT_TTL_MS = 30 * 60 * 1000; // auto-cleanup exports after 30 min

const getUserContext = async (userId) => {
  const user = await UserModel.findById(userId);
  const profile = await ProfileModel.findByUserId(userId);
  return { id: user.id, email: user.email, currency: profile?.currency || 'PKR' };
};

const getMonthlyReport = async (userId, year, month) => {
  const { startDate, endDate } = getMonthRange(year, month);
  const [income, expense, categoryBreakdown, monthlyTotals, recent] = await Promise.all([
    TransactionModel.getTotalByType(userId, startDate, endDate, 'income'),
    TransactionModel.getTotalByType(userId, startDate, endDate, 'expense'),
    TransactionModel.getCategorySpending(userId, startDate, endDate),
    TransactionModel.getMonthlyTotals(userId, 6),
    TransactionModel.findByUser(userId, { page: 1, limit: 50, startDate, endDate })
  ]);

  const byMonth = {};
  for (const row of monthlyTotals) {
    const key = `${row.year}-${String(row.month).padStart(2, '0')}`;
    if (!byMonth[key]) byMonth[key] = { year: row.year, month: row.month, income: 0, expense: 0 };
    byMonth[key][row.type] += parseFloat(row.total);
  }
  const monthlyTrend = Object.values(byMonth).sort((a, b) => a.year - b.year || a.month - b.month)
    .map((m) => ({ ...m, label: `${getMonthName(m.month).substring(0, 3)} ${m.year}`, income: round2(m.income), expense: round2(m.expense) }));

  return {
    period: { month, year, label: `${getMonthName(month)} ${year}`, startDate, endDate },
    totals: { income: round2(income), expense: round2(expense), count: recent.total },
    categoryBreakdown: categoryBreakdown.map((c) => ({ ...c, total: round2(parseFloat(c.total)) })),
    monthlyTrend,
    transactions: recent.transactions
  };
};

const getMonthlyReportWithBudgets = async (userId, year, month) => {
  const report = await getMonthlyReport(userId, year, month);
  await BudgetModel.recalculateSpent(userId, month, year);
  const budgets = await BudgetModel.findByUser(userId, month, year);
  report.budgets = budgets.map((b) => ({ ...b, amount: round2(parseFloat(b.amount)), spent: round2(parseFloat(b.spent)) }));
  return report;
};

const getRangeReport = async (userId, startDate, endDate, groupBy = 'daily', categoryId = '', incomeCategoryId = '') => {
  const filters = { page: 1, limit: 10000, startDate, endDate };
  if (categoryId) filters.category_id = parseInt(categoryId);
  const { transactions, total } = await TransactionModel.findByUser(userId, filters);

  const income = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0);
  const expense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0);

  let breakdown = [];
  let breakdownLabel = 'Breakdown';
  if (groupBy === 'daily') {
    const daily = await TransactionModel.getDailySpending(userId, startDate, endDate);
    const byDate = {};
    for (const row of daily) {
      if (!byDate[row.date]) byDate[row.date] = { label: row.date, income: 0, expense: 0 };
      byDate[row.date][row.type] += parseFloat(row.total);
    }
    breakdown = Object.values(byDate).map((d) => ({ ...d, income: round2(d.income), expense: round2(d.expense) }));
    breakdownLabel = 'Daily Breakdown';
  } else if (groupBy === 'weekly') {
    const weekly = await TransactionModel.getWeeklySpending(userId, startDate, endDate);
    const byWeek = {};
    for (const row of weekly) {
      const label = `${row.year}-W${String(row.week).padStart(2, '0')}`;
      if (!byWeek[label]) byWeek[label] = { label, income: 0, expense: 0 };
      byWeek[label][row.type] += parseFloat(row.total);
    }
    breakdown = Object.values(byWeek).map((w) => ({ ...w, income: round2(w.income), expense: round2(w.expense) }));
    breakdownLabel = 'Weekly Breakdown';
  } else {
    const categories = await TransactionModel.getCategorySpending(userId, startDate, endDate);
    breakdown = categories.map((c) => ({ label: c.category_name, total: round2(parseFloat(c.total)) }));
    breakdownLabel = 'Category Breakdown';
  }

  return {
    period: { title: `${startDate} to ${endDate}`, startDate, endDate },
    totals: { income: round2(income), expense: round2(expense), count: total },
    breakdown,
    breakdownLabel,
    transactions
  };
};

const generateMonthlyPDF = async (userId, year, month) => {
  const user = await getUserContext(userId);
  const report = await getMonthlyReportWithBudgets(userId, year, month);
  const { filePath, filename } = await buildMonthlyReportPDF({ user, ...report });
  scheduleCleanup(filePath);
  return { filePath, filename, download_url: `/api/v1/exports/download/${filename}` };
};

const generateRangePDF = async (userId, startDate, endDate, groupBy, breakdown, breakdownLabel, title) => {
  const user = await getUserContext(userId);
  const { filePath, filename } = await buildRangeReportPDF({
    user,
    period: { title: title || `${startDate} to ${endDate}`, startDate, endDate },
    totals: { income: 0, expense: 0, count: 0 },
    breakdown,
    breakdownLabel
  });
  scheduleCleanup(filePath);
  return { filePath, filename, download_url: `/api/v1/exports/download/${filename}` };
};

const scheduleCleanup = (filePath) => {
  setTimeout(() => {
    fs.unlink(filePath, () => {});
  }, REPORT_TTL_MS).unref();
};

const getExportFile = (filename) => {
  const safe = path.basename(filename); // prevent path traversal
  const filePath = path.join(require('../helpers/reportBuilder').EXPORTS_DIR, safe);
  if (!fs.existsSync(filePath)) return null;
  return filePath;
};

module.exports = { getMonthlyReport, getMonthlyReportWithBudgets, getRangeReport, generateMonthlyPDF, generateRangePDF, getExportFile };
