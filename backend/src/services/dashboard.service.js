const TransactionModel = require('../models/transaction.model');
const AccountModel = require('../models/account.model');
const BudgetModel = require('../models/budget.model');
const GoalModel = require('../models/goal.model');
const BillModel = require('../models/bill.model');
const InsightModel = require('../models/insight.model');
const TipModel = require('../models/tip.model');
const UserModel = require('../models/user.model');
const ProfileModel = require('../models/profile.model');
const NotificationModel = require('../models/notification.model');
const { getCurrentMonth, getMonthRange } = require('../utils/dates');
const { round2, savingsRate } = require('../helpers/statistics');

const getDashboard = async (userId, selectedMonth, selectedYear) => {
  const user = await UserModel.findById(userId);
  const profile = await ProfileModel.findByUserId(userId);
  const current = getCurrentMonth();
  const month = Number(selectedMonth) || current.month, year = Number(selectedYear) || current.year;
  const { startDate, endDate } = getMonthRange(year, month);

  // Core financials — all from MySQL
  const [totalIncome, totalExpense, totalBalance] = await Promise.all([
    TransactionModel.getTotalByType(userId, startDate, endDate, 'income'),
    TransactionModel.getTotalByType(userId, startDate, endDate, 'expense'),
    AccountModel.getTotalBalance(userId)
  ]);

  const savings = round2(totalIncome - totalExpense);
  const rate = savingsRate(totalIncome, totalExpense);

  // Recent transactions & top category
  const [recentTransactions, topCategory, categorySpending] = await Promise.all([
    TransactionModel.getRecent(userId, 5),
    TransactionModel.getTopCategory(userId, startDate, endDate),
    TransactionModel.getCategorySpending(userId, startDate, endDate)
  ]);

  // Budgets vs actual
  await BudgetModel.recalculateSpent(userId, month, year);
  const budgets = await BudgetModel.findByUser(userId, month, year);
  const budgetTotals = await BudgetModel.getTotalBudget(userId, month, year);
  const budgetSummary = {
    total_budget: round2(parseFloat(budgetTotals.total)),
    total_spent: round2(parseFloat(budgetTotals.spent)),
    percentage: parseFloat(budgetTotals.total) > 0 ? round2((parseFloat(budgetTotals.spent) / parseFloat(budgetTotals.total)) * 100) : 0
  };

  // Alerts
  const nearLimit = await BudgetModel.getNearLimit(userId, month, year);
  const exceeded = await BudgetModel.getExceeded(userId, month, year);
  const budgetAlerts = [
    ...exceeded.map((b) => ({ type: 'exceeded', category: b.category_name, budget_id: b.id, percentage: b.amount > 0 ? round2((parseFloat(b.spent) / parseFloat(b.amount)) * 100) : 0 })),
    ...nearLimit.map((b) => ({ type: 'near_limit', category: b.category_name, budget_id: b.id, percentage: b.amount > 0 ? round2((parseFloat(b.spent) / parseFloat(b.amount)) * 100) : 0 }))
  ];

  // Goals overview
  const { goals } = await GoalModel.findByUser(userId, { status: 'active' });
  const activeGoals = goals.map((g) => ({
    id: g.id, name: g.name,
    percentage: parseFloat(g.target_amount) > 0 ? round2(Math.min(100, (parseFloat(g.current_amount) / parseFloat(g.target_amount)) * 100)) : 0
  }));

  // Upcoming bills
  const upcomingBills = await BillModel.getUpcoming(userId, 7);

  // Saving tips: personalized + system fallback
  const savingTips = buildSavingTips({ totalExpense, categorySpending, budgets, profile });

  // Current insight
  const currentInsight = await InsightModel.getLatest(userId);

  // Unread notifications count
  const unreadNotifications = await NotificationModel.getUnreadCount(userId);

  const hour = new Date().getHours();
  const greetingName = profile?.first_name || user.email.split('@')[0];
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return {
    greeting: {
      message: `${greeting}, ${greetingName}!`,
      name: greetingName,
      first_name: profile?.first_name || '',
      date: new Date().toISOString()
    },
    balance: {
      total: round2(totalBalance),
      currency: profile?.currency || 'PKR'
    },
    month_summary: {
      month, year,
      income: round2(totalIncome),
      expense: round2(totalExpense),
      savings,
      savings_rate: rate
    },
    top_category: topCategory ? { name: topCategory.name, total: round2(parseFloat(topCategory.total)) } : null,
    budget_summary: budgetSummary,
    budget_alerts: budgetAlerts,
    recent_transactions: recentTransactions,
    budgets,
    category_spending: categorySpending,
    monthly_overview: (await require('./report.service').getMonthlyReport(userId, year, month)).monthlyTrend.map(r=>({...r,name:r.label})),
    spending_trend: await buildSpendingTrend(userId, startDate, endDate),
    saving_tips: savingTips,
    current_insight: currentInsight,
    active_goals: activeGoals,
    upcoming_bills: upcomingBills,
    unread_notifications: unreadNotifications
  };
};

const buildSpendingTrend = async (userId, startDate, endDate) => {
  const daily = await TransactionModel.getDailySpending(userId, startDate, endDate);
  const byDate = {};
  for (const row of daily) {
    if (!byDate[row.date]) byDate[row.date] = { date: row.date, income: 0, expense: 0 };
    byDate[row.date][row.type] += parseFloat(row.total);
  }
  return Object.values(byDate).map((d) => ({ date: d.date, income: round2(d.income), expense: round2(d.expense) }));
};

/**
 * Personalized saving tips built from real user data with potential savings impact.
 */
const buildSavingTips = ({ totalExpense, categorySpending, budgets, profile }) => {
  const tips = [];

  for (const cat of categorySpending) {
    const total = parseFloat(cat.total);
    const share = totalExpense > 0 ? (total / totalExpense) * 100 : 0;
    if (share > 25 && cat.category_name === 'Food') {
      tips.push({
        title: 'Reduce food spending',
        content: `Food is ${Math.round(share)}% of your spending this month. Cooking 2 more meals at home per week could save around PKR ${round2(total * 0.2)}.`,
        potential_savings: round2(total * 0.2),
        category: 'food'
      });
    }
    if (cat.category_name === 'Entertainment' && share > 15) {
      tips.push({
        title: 'Trim entertainment costs',
        content: `Entertainment takes ${Math.round(share)}% of your expenses. Free campus events could cut this meaningfully.`,
        potential_savings: round2(total * 0.3),
        category: 'entertainment'
      });
    }
  }

  for (const b of budgets) {
    const pct = parseFloat(b.amount) > 0 ? (parseFloat(b.spent) / parseFloat(b.amount)) * 100 : 0;
    if (pct > 90) {
      tips.push({
        title: `${b.category_name} budget nearly used`,
        content: `You've used ${Math.round(pct)}% of your ${b.category_name} budget. Pause non-essential ${b.category_name.toLowerCase()} spending for the rest of the month.`,
        potential_savings: round2(Math.max(0, parseFloat(b.spent) - parseFloat(b.amount))),
        category: 'budget'
      });
    }
  }

  if (profile && parseFloat(profile.monthly_savings_goal) > 0) {
    tips.push({
      title: 'Automate your savings',
      content: `Move money to savings as soon as your allowance arrives — don't wait until month end.`,
      potential_savings: parseFloat(profile.monthly_savings_goal),
      category: 'savings'
    });
  }

  if (tips.length === 0) {
    tips.push({
      title: 'Keep tracking!',
      content: 'Record your income and expenses to build a clearer picture of your finances.',
      potential_savings: 0,
      category: 'general'
    });
  }

  return tips.slice(0, 4);
};

module.exports = { getDashboard, buildSavingTips };
