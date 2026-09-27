const { round2, percentageChange, savingsRate } = require('./statistics');

/**
 * Rule-based insight builder. Uses the keyword AI provider for language generation
 * but the analytics data always comes from MySQL. Output is advisory.
 */
const buildInsight = (data) => {
  const {
    month, year,
    totalIncome, totalExpense,
    previousIncome, previousExpense,
    topCategories = [],
    categoryGrowth = [],
    budgetStatus = [],
    transactionCount = 0,
    unusualTransactions = [],
    savingsGoal = 0
  } = data;

  const savings = round2(totalIncome - totalExpense);
  const rate = savingsRate(totalIncome, totalExpense);
  const expenseChange = percentageChange(totalExpense, previousExpense);
  const incomeChange = percentageChange(totalIncome, previousIncome);

  const parts = [];
  parts.push(`In ${getMonthName(month)} ${year}, you recorded ${transactionCount} transaction${transactionCount === 1 ? '' : 's'} with PKR ${formatNum(totalIncome)} income and PKR ${formatNum(totalExpense)} expenses, saving PKR ${formatNum(savings)} (${rate}% savings rate).`);

  if (previousExpense > 0) {
    if (expenseChange > 10) parts.push(`Your spending increased by ${Math.abs(round2(expenseChange))}% compared to last month — worth reviewing your largest categories.`);
    else if (expenseChange < -10) parts.push(`Great progress! Your spending decreased by ${Math.abs(round2(expenseChange))}% compared to last month.`);
    else parts.push(`Your spending was relatively stable compared to last month.`);
  }
  if (previousIncome > 0 && Math.abs(incomeChange) > 10) {
    parts.push(`Income ${incomeChange > 0 ? 'grew' : 'dropped'} by ${Math.abs(round2(incomeChange))}% versus last month.`);
  }

  if (topCategories.length > 0) {
    const top = topCategories[0];
    const share = totalExpense > 0 ? round2((top.total / totalExpense) * 100) : 0;
    parts.push(`Your largest spending category was ${top.category_name} at PKR ${formatNum(top.total)} (${share}% of expenses).`);
  }

  // Category growth callouts
  const growing = categoryGrowth.filter((c) => c.change > 25).slice(0, 2);
  if (growing.length > 0) {
    parts.push(`Notable increases: ${growing.map((c) => `${c.category_name} (+${round2(c.change)}%)`).join(', ')}.`);
  }

  // Budget status
  const exceeded = budgetStatus.filter((b) => b.percentage > 100);
  const near = budgetStatus.filter((b) => b.percentage >= 80 && b.percentage <= 100);
  if (exceeded.length > 0) parts.push(`You exceeded ${exceeded.length} budget${exceeded.length === 1 ? '' : 's'}: ${exceeded.map((b) => b.category_name).join(', ')}.`);
  if (near.length > 0) parts.push(`${near.length} budget${near.length === 1 ? ' is' : 's are'} near the limit: ${near.map((b) => b.category_name).join(', ')}.`);

  // Unusual transactions
  if (unusualTransactions.length > 0) {
    const u = unusualTransactions[0];
    parts.push(`One unusually large expense of PKR ${formatNum(u.amount)} ("${u.description}") was detected this month.`);
  }

  // Savings goal comparison
  let goalNote = '';
  if (savingsGoal > 0) {
    if (savings >= savingsGoal) goalNote = `You met your monthly savings goal of PKR ${formatNum(savingsGoal)}. Excellent!`;
    else goalNote = `You saved PKR ${formatNum(savings)} against a goal of PKR ${formatNum(savingsGoal)} — PKR ${formatNum(savingsGoal - savings)} short.`;
  }

  const summary = parts.join(' ');

  // Actionable recommendations
  const recommendations = [];
  if (rate < 10) recommendations.push('Aim to save at least 10-20% of your income each month.');
  if (exceeded.length > 0) recommendations.push(`Review and raise (or respect) budgets for: ${exceeded.map((b) => b.category_name).join(', ')}.`);
  if (growing.length > 0) recommendations.push(`Watch the fast-growing categories: ${growing.map((c) => c.category_name).join(', ')} — set a specific budget for them.`);
  if (topCategories.length > 0 && topCategories[0].category_name === 'Food') recommendations.push('Food is your biggest expense — cooking more meals at home could cut this significantly.');
  if (savingsGoal > 0 && savings < savingsGoal) recommendations.push('Automate a small transfer to your savings goal right when you receive income.');
  if (recommendations.length === 0) recommendations.push('Keep up your consistent tracking habit — steady data leads to better insights.');

  const tip = recommendations.join(' ');

  return {
    summary,
    tip,
    metadata: {
      total_income: round2(totalIncome),
      total_expense: round2(totalExpense),
      total_savings: savings,
      savings_rate: rate,
      expense_change_percent: round2(expenseChange),
      income_change_percent: round2(incomeChange),
      transaction_count: transactionCount,
      generated_by: 'rule-engine',
      advisory: true
    }
  };
};

const getMonthName = (month) => {
  const names = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return names[month - 1] || `Month ${month}`;
};

const formatNum = (n) => round2(n || 0).toLocaleString('en-US');

module.exports = { buildInsight, getMonthName };
