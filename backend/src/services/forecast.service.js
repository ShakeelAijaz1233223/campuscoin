const TransactionModel = require('../models/transaction.model');
const BillModel = require('../models/bill.model');
const RecurringModel = require('../models/recurring.model');
const GoalModel = require('../models/goal.model');
const AccountModel = require('../models/account.model');
const AnalyticsService = require('./analytics.service');
const { linearForecast, round2 } = require('../helpers/statistics');
const { getNextOccurrence } = require('../utils/dates');

/**
 * Upcoming month forecast — isolated advanced feature.
 * Combines: linear trend of past months + confirmed recurring rules + upcoming bills.
 * Advisory only; never blocks any mandatory feature.
 */
const getUpcomingMonthForecast = async (userId) => {
  const monthly = await AnalyticsService.getMonthlySpending(userId, 6);
  const expenses = monthly.map((m) => m.expense);
  const incomes = monthly.map((m) => m.income);

  const trendExpense = linearForecast(expenses);
  const trendIncome = linearForecast(incomes);

  // Confirmed recurring for next month
  const { records: recurring } = await RecurringModel.findByUser(userId, { status: 'active', limit: 100 });
  const today = new Date().toISOString().split('T')[0];
  const in30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  let recurringIncome = 0;
  let recurringExpense = 0;
  for (const rule of recurring) {
    let next = rule.next_occurrence;
    let guard = 0;
    while (next && next <= in30 && guard < 5) {
      if (next >= today) {
        if (rule.type === 'income') recurringIncome += parseFloat(rule.amount);
        else recurringExpense += parseFloat(rule.amount);
      }
      next = getNextOccurrence(rule.frequency, next);
      guard++;
    }
  }

  // Upcoming unpaid bills in the next 30 days
  const upcoming = await BillModel.getUpcoming(userId, 30);
  const billTotal = upcoming.reduce((s, b) => s + parseFloat(b.amount), 0);

  const balance = await AccountModel.getTotalBalance(userId);

  // Weight: if there is recurring data, blend with trend
  const forecastExpense = recurringExpense > 0 || billTotal > 0
    ? round2(trendExpense * 0.4 + (recurringExpense + billTotal) * 0.6)
    : trendExpense;
  const forecastIncome = recurringIncome > 0
    ? round2(trendIncome * 0.5 + recurringIncome * 0.5)
    : trendIncome;

  // Goals at risk: projected balance vs remaining targets
  const { goals } = await GoalModel.findByUser(userId, { status: 'active', limit: 100 });
  const projectedBalance = round2(balance + forecastIncome - forecastExpense);

  return {
    period: 'next_30_days',
    forecast: {
      income: forecastIncome,
      expense: forecastExpense,
      net: round2(forecastIncome - forecastExpense),
      projected_balance: projectedBalance
    },
    components: {
      trend_based_expense: trendExpense,
      trend_based_income: trendIncome,
      recurring_income: round2(recurringIncome),
      recurring_expense: round2(recurringExpense),
      upcoming_bills_total: round2(billTotal),
      upcoming_bills_count: upcoming.length
    },
    advisory: true,
    disclaimer: 'Forecasts are estimates based on historical patterns and scheduled items. Actual results may vary.'
  };
};

module.exports = { getUpcomingMonthForecast };
