const TransactionModel = require('../models/transaction.model');
const BudgetModel = require('../models/budget.model');
const {
  buildMonthlyReportPDF,
  buildRangeReportPDF
} = require('../helpers/reportBuilder');
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
  return {
    id: user.id,
    email: user.email,
    currency: profile?.currency || 'PKR'
  };
};

const getMonthlyReport = async (userId, year, month) => {
  const { startDate, endDate } = getMonthRange(year, month);
  const [income, expense, categoryBreakdown, monthlyTotals, recent] =
    await Promise.all([
      TransactionModel.getTotalByType(userId, startDate, endDate, 'income'),
      TransactionModel.getTotalByType(userId, startDate, endDate, 'expense'),
      TransactionModel.getCategorySpending(userId, startDate, endDate),
      TransactionModel.getMonthlyTotals(userId, 6, endDate),
      TransactionModel.findByUser(userId, {
        page: 1,
        limit: 50,
        startDate,
        endDate
      })
    ]);

  const byMonth = {};
  for (const row of monthlyTotals) {
    const key = `${row.year}-${String(row.month).padStart(2, '0')}`;
    if (!byMonth[key])
      byMonth[key] = {
        year: row.year,
        month: row.month,
        income: 0,
        expense: 0
      };
    byMonth[key][row.type] += parseFloat(row.total);
  }
  const monthlyTrend = Object.values(byMonth)
    .sort((a, b) => a.year - b.year || a.month - b.month)
    .map((m) => ({
      ...m,
      label: `${getMonthName(m.month).substring(0, 3)} ${m.year}`,
      income: round2(m.income),
      expense: round2(m.expense)
    }));

  return {
    period: {
      month,
      year,
      label: `${getMonthName(month)} ${year}`,
      startDate,
      endDate
    },
    totals: {
      income: round2(income),
      expense: round2(expense),
      count: recent.total
    },
    categoryBreakdown: categoryBreakdown.map((c) => ({
      ...c,
      total: round2(parseFloat(c.total))
    })),
    monthlyTrend,
    transactions: recent.transactions
  };
};

const getMonthlyReportWithBudgets = async (userId, year, month) => {
  const report = await getMonthlyReport(userId, year, month);
  await BudgetModel.recalculateSpent(userId, month, year);
  const budgets = await BudgetModel.findByUser(userId, month, year);
  report.budgets = budgets.map((b) => ({
    ...b,
    amount: round2(parseFloat(b.amount)),
    spent: round2(parseFloat(b.spent))
  }));
  return report;
};

const getRangeReport = async (
  userId,
  startDate,
  endDate,
  groupBy = 'daily',
  categoryId = '',
  incomeCategoryId = ''
) => {
  if (startDate > endDate)
    throw new (require('../utils/errors').BadRequestError)(
      'Start date must be on or before end date'
    );
  const db = require('../config/database');
  const clauses = [
    't.user_id = ?',
    "t.status = 'active'",
    't.date >= ?',
    't.date <= ?'
  ];
  const values = [userId, startDate, endDate];
  if (categoryId) {
    clauses.push("(t.type != 'expense' OR t.category_id = ?)");
    values.push(Number(categoryId));
  }
  if (incomeCategoryId) {
    clauses.push("(t.type != 'income' OR t.category_id = ?)");
    values.push(Number(incomeCategoryId));
  }
  const transactions = await db.query(
    `SELECT t.*, c.name AS category_name FROM transactions t LEFT JOIN categories c ON c.id=t.category_id WHERE ${clauses.join(' AND ')} ORDER BY t.date, t.id`,
    values
  );
  const totals = { income: 0, expense: 0, count: transactions.length };
  const daily = {},
    weekly = {},
    monthly = {},
    categories = {};
  for (const t of transactions) {
    if (!['income', 'expense'].includes(t.type)) continue;
    const amount = Number(t.amount);
    totals[t.type] += amount;
    const day = t.date.slice(0, 10),
      month = day.slice(0, 7);
    const date = new Date(day + 'T00:00:00Z');
    date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
    const week = date.toISOString().slice(0, 10);
    for (const [group, key] of [
      [daily, day],
      [weekly, week],
      [monthly, month]
    ]) {
      group[key] ||= { name: key, income: 0, expense: 0, amount: 0 };
      group[key][t.type] += amount;
      if (t.type === 'expense') group[key].amount += amount;
    }
    if (t.type === 'expense') {
      const key = t.category_name || 'Uncategorized';
      categories[key] ||= { name: key, amount: 0 };
      categories[key].amount += amount;
    }
  }
  totals.income = round2(totals.income);
  totals.expense = round2(totals.expense);
  const rows = (group) =>
    Object.values(group).map((r) =>
      Object.fromEntries(
        Object.entries(r).map(([k, v]) => [
          k,
          typeof v === 'number' ? round2(v) : v
        ])
      )
    );
  const dailyRows = rows(daily),
    weeklyRows = rows(weekly),
    categoryRows = rows(categories);
  const breakdown = (
    groupBy === 'category'
      ? categoryRows
      : groupBy === 'weekly'
        ? weeklyRows
        : dailyRows
  ).map((r) => ({ ...r, label: r.name, total: r.amount }));
  const user = await getUserContext(userId);
  return {
    currency: user.currency,
    period: {
      title: `${startDate} to ${endDate}`,
      label: `${startDate} to ${endDate}`,
      startDate,
      endDate
    },
    totals,
    breakdown,
    breakdownLabel: `${groupBy} breakdown`,
    transactions,
    daily: dailyRows,
    weekly: weeklyRows,
    monthly: rows(monthly),
    categories: categoryRows
  };
};

const exportRange = async (userId, params) => {
  const report = await getRangeReport(
    userId,
    params.start_date,
    params.end_date,
    params.group_by,
    params.category_id,
    params.income_category_id
  );
  if (params.format === 'json')
    return {
      body: JSON.stringify(report, null, 2),
      type: 'application/json',
      extension: 'json'
    };
  if (params.format === 'csv') {
    const { escapeCSV: escape } = require('../utils/csv');
    const keys = [
      'date',
      'description',
      'type',
      'amount',
      'category_name',
      'notes'
    ];
    return {
      body: [
        keys.join(','),
        ...report.transactions.map((t) =>
          keys.map((k) => escape(t[k])).join(',')
        )
      ].join('\r\n'),
      type: 'text/csv; charset=utf-8',
      extension: 'csv'
    };
  }
  const user = await getUserContext(userId);
  const result = await buildRangeReportPDF({ user, ...report });
  scheduleCleanup(result.filePath);
  return { ...result, type: 'application/pdf', extension: 'pdf' };
};

const generateMonthlyPDF = async (userId, year, month) => {
  const user = await getUserContext(userId);
  const report = await getMonthlyReportWithBudgets(userId, year, month);
  const { filePath, filename } = await buildMonthlyReportPDF({
    user,
    ...report
  });
  scheduleCleanup(filePath);
  return {
    filePath,
    filename,
    download_url: `/api/v1/exports/download/${filename}`
  };
};

const generateRangePDF = async (
  userId,
  startDate,
  endDate,
  groupBy,
  breakdown,
  breakdownLabel,
  title
) => {
  const user = await getUserContext(userId);
  const report = await getRangeReport(userId, startDate, endDate, groupBy);
  if (title) report.period.title = title;
  const { filePath, filename } = await buildRangeReportPDF({ user, ...report });
  scheduleCleanup(filePath);
  return {
    filePath,
    filename,
    download_url: `/api/v1/exports/download/${filename}`
  };
};

const scheduleCleanup = (filePath) => {
  setTimeout(() => {
    fs.unlink(filePath, () => {});
  }, REPORT_TTL_MS).unref();
};

const getExportFile = (filename) => {
  if (
    typeof filename !== 'string' ||
    path.basename(filename) !== filename ||
    !/^report_[A-Za-z0-9_-]+\.pdf$/.test(filename)
  )
    return null;
  const safe = filename;
  const filePath = path.join(
    require('../helpers/reportBuilder').EXPORTS_DIR,
    safe
  );
  if (!fs.existsSync(filePath)) return null;
  return filePath;
};

module.exports = {
  exportRange,
  getMonthlyReport,
  getMonthlyReportWithBudgets,
  getRangeReport,
  generateMonthlyPDF,
  generateRangePDF,
  getExportFile
};
