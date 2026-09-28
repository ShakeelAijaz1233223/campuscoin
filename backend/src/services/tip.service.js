const TipModel = require('../models/tip.model');
const TransactionModel = require('../models/transaction.model');
const BudgetModel = require('../models/budget.model');
const AnalyticsService = require('./analytics.service');
const ProfileModel = require('../models/profile.model');
const { getCurrentMonth, getMonthRange } = require('../utils/dates');
const { round2 } = require('../helpers/statistics');
const { NotFoundError } = require('../utils/errors');

/**
 * Personalized saving-tips engine.
 * Uses current spending, historical average, budgets, savings goal, and category growth.
 * Each tip carries a potential savings impact and a rank score.
 */
const getPersonalizedTips = async (userId) => {
  const { month, year } = getCurrentMonth();
  const { startDate, endDate } = getMonthRange(year, month);

  const [totalExpense, categorySpending, profile] = await Promise.all([
    TransactionModel.getTotalByType(userId, startDate, endDate, 'expense'),
    TransactionModel.getCategorySpending(userId, startDate, endDate),
    ProfileModel.findByUserId(userId)
  ]);

  const [averages, growth] = await Promise.all([
    AnalyticsService.getHistoricalAverages(userId, 6),
    AnalyticsService.getCategoryGrowth(userId, 2)
  ]);

  await BudgetModel.recalculateSpent(userId, month, year);
  const budgets = await BudgetModel.findByUser(userId, month, year);

  const tips = [];

  // 1. Spending above historical average
  if (averages.avg_expense > 0 && totalExpense > averages.avg_expense * 1.1) {
    const over = round2(totalExpense - averages.avg_expense);
    tips.push({
      title: 'Spending above your average',
      content: `Your expenses this month (${profile?.currency || 'PKR'} ${round2(totalExpense).toLocaleString()}) are ${profile?.currency || 'PKR'} ${over.toLocaleString()} above your 6-month average. Trim discretionary spending to get back on track.`,
      potential_savings: over,
      rank_score: 90,
      source: 'historical_average'
    });
  }

  // 2. Fast-growing categories
  for (const g of growth
    .filter((x) => x.change_percent > 30 && x.current_total > 0)
    .slice(0, 2)) {
    tips.push({
      title: `${g.category_name} spending growing fast`,
      content: `${g.category_name} spending is up ${Math.round(g.change_percent)}% vs last month (${profile?.currency || 'PKR'} ${g.current_total.toLocaleString()} vs ${profile?.currency || 'PKR'} ${g.previous_total.toLocaleString()}). Setting a budget here could save around ${profile?.currency || 'PKR'} ${round2(g.current_total * 0.25)}.`,
      potential_savings: round2(g.current_total * 0.25),
      rank_score: 80,
      source: 'category_growth'
    });
  }

  // 3. Budget risk
  for (const b of budgets) {
    const pct =
      parseFloat(b.amount) > 0
        ? (parseFloat(b.spent) / parseFloat(b.amount)) * 100
        : 0;
    if (pct > 90) {
      tips.push({
        title: `${b.category_name} budget almost gone`,
        content: `${Math.round(pct)}% of your ${b.category_name} budget is used. Avoiding further ${b.category_name.toLowerCase()} spending keeps you within plan.`,
        potential_savings: round2(
          Math.max(0, parseFloat(b.spent) - parseFloat(b.amount))
        ),
        rank_score: pct > 100 ? 95 : 85,
        source: 'budget'
      });
    }
  }

  // 4. Top category share
  const top = categorySpending[0];
  if (top && totalExpense > 0 && parseFloat(top.total) / totalExpense > 0.3) {
    tips.push({
      title: `${top.category_name} dominates your spending`,
      content: `${top.category_name} is ${Math.round((parseFloat(top.total) / totalExpense) * 100)}% of your expenses. Cutting it by 20% saves about ${profile?.currency || 'PKR'} ${round2(parseFloat(top.total) * 0.2)} monthly.`,
      potential_savings: round2(parseFloat(top.total) * 0.2),
      rank_score: 75,
      source: 'current_spending'
    });
  }

  // 5. Savings goal nudge
  if (profile && parseFloat(profile.monthly_savings_goal) > 0) {
    const income = await TransactionModel.getTotalByType(
      userId,
      startDate,
      endDate,
      'income'
    );
    const saved = income - totalExpense;
    if (saved < parseFloat(profile.monthly_savings_goal)) {
      tips.push({
        title: 'Behind your savings goal',
        content: `You've saved ${profile?.currency || 'PKR'} ${round2(saved).toLocaleString()} of your ${profile?.currency || 'PKR'} ${parseFloat(profile.monthly_savings_goal).toLocaleString()} goal. Small daily cuts of ${profile?.currency || 'PKR'} ${round2(Math.max(1, (parseFloat(profile.monthly_savings_goal) - saved) / 30))} close the gap by month end.`,
        potential_savings: round2(
          parseFloat(profile.monthly_savings_goal) - Math.max(0, saved)
        ),
        rank_score: 88,
        source: 'savings_goal'
      });
    }
  }

  // 6. System tips fallback/padding
  const systemTips = await TipModel.findRandom(2);
  for (const t of systemTips) {
    if (tips.length >= 6) break;
    tips.push({
      id: t.id,
      title: t.title,
      content: t.content,
      potential_savings: 0,
      rank_score: t.priority,
      source: 'system',
      is_system: true
    });
  }

  return tips.sort((a, b) => b.rank_score - a.rank_score);
};

const getSystemTips = async (filters) => {
  return TipModel.findAll(filters);
};

const getTip = async (id) => {
  const tip = await TipModel.findById(id);
  if (!tip) throw new NotFoundError('Tip not found');
  return tip;
};

const dismissTip = async (userId, tipKey) => {
  const SettingModel = require('../models/setting.model');
  const raw = await SettingModel.get(userId, 'dismissed_tips');
  const dismissed = raw ? JSON.parse(raw) : [];
  if (!dismissed.includes(tipKey)) dismissed.push(tipKey);
  await SettingModel.set(userId, 'dismissed_tips', JSON.stringify(dismissed));
  return { dismissed };
};

const getDismissedTips = async (userId) => {
  const SettingModel = require('../models/setting.model');
  const raw = await SettingModel.get(userId, 'dismissed_tips');
  return raw ? JSON.parse(raw) : [];
};

const pinTip = async (userId, tipKey) => {
  const SettingModel = require('../models/setting.model');
  await SettingModel.set(userId, 'pinned_tip', tipKey);
  return { pinned: tipKey };
};

const getTipHistory = async (userId) => {
  const SettingModel = require('../models/setting.model');
  const raw = await SettingModel.get(userId, 'tip_history');
  return raw ? JSON.parse(raw) : [];
};

const saveTipHistory = async (userId, tips) => {
  const SettingModel = require('../models/setting.model');
  const history = {
    generated_at: new Date().toISOString(),
    tips: tips.map((t) => ({
      title: t.title,
      potential_savings: t.potential_savings,
      source: t.source
    }))
  };
  await SettingModel.set(userId, 'tip_history', JSON.stringify(history));
  return history;
};

module.exports = {
  getPersonalizedTips,
  getSystemTips,
  getTip,
  dismissTip,
  getDismissedTips,
  pinTip,
  getTipHistory,
  saveTipHistory
};
