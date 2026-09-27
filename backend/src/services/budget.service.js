const BudgetModel = require('../models/budget.model');
const CategoryModel = require('../models/category.model');
const ActivityModel = require('../models/activity.model');
const NotificationModel = require('../models/notification.model');
const { getCurrentMonth } = require('../utils/dates');
const { NotFoundError, BadRequestError, ConflictError, ForbiddenError } = require('../utils/errors');
const { round2 } = require('../helpers/statistics');

const enrichBudget = (budget) => {
  const amount = parseFloat(budget.amount);
  const spent = parseFloat(budget.spent);
  const remaining = round2(amount - spent);
  const percentage = amount > 0 ? round2((spent / amount) * 100) : 0;
  return {
    ...budget,
    remaining,
    percentage,
    near_limit: percentage >= 80 && percentage <= 100,
    exceeded: percentage > 100
  };
};

const getBudgets = async (userId, month, year) => {
  const { month: curMonth, year: curYear } = getCurrentMonth();
  const m = parseInt(month) || curMonth;
  const y = parseInt(year) || curYear;

  // Keep spent fresh from actual transactions
  await BudgetModel.recalculateSpent(userId, m, y);

  const budgets = await BudgetModel.findByUser(userId, m, y);
  const totals = await BudgetModel.getTotalBudget(userId, m, y);

  const enriched = budgets.map(enrichBudget);
  const totalAmount = parseFloat(totals.total);
  const totalSpent = parseFloat(totals.spent);

  return {
    budgets: enriched,
    summary: {
      month: m,
      year: y,
      total_budget: round2(totalAmount),
      total_spent: round2(totalSpent),
      total_remaining: round2(totalAmount - totalSpent),
      overall_percentage: totalAmount > 0 ? round2((totalSpent / totalAmount) * 100) : 0
    }
  };
};

const getBudget = async (userId, id) => {
  const budget = await BudgetModel.findById(id);
  if (!budget || budget.user_id !== userId || budget.status !== 'active') throw new NotFoundError('Budget not found');
  return enrichBudget(budget);
};

const createBudget = async (userId, data, ip = null) => {
  const category = await CategoryModel.findById(data.category_id);
  if (!category || (category.user_id !== userId && category.is_default !== 1)) throw new BadRequestError('Invalid category');
  if (category.type !== 'expense') throw new BadRequestError('Budgets can only be set for expense categories');

  if (data.month < 1 || data.month > 12) throw new BadRequestError('Month must be between 1 and 12');
  if (data.amount <= 0) throw new BadRequestError('Budget amount must be positive');

  const existing = await BudgetModel.findByUserAndCategory(userId, data.category_id, data.month, data.year);
  if (existing && existing.status === 'active') throw new ConflictError(`A budget for this category already exists for ${data.month}/${data.year}`);

  data.user_id = userId;
  const result = existing ? {id:existing.id} : await BudgetModel.create(data);
  if(existing)await BudgetModel.update(existing.id,{amount:data.amount,status:'active'});

  // Calculate spent and generate alert if applicable
  await BudgetModel.recalculateSpent(userId, data.month, data.year);
  const budget = await BudgetModel.findById(result.id);
  const enriched = enrichBudget(budget);

  if (enriched.exceeded) {
    await NotificationModel.create(userId, 'budget_exceeded', 'Budget Exceeded',
      `Your ${budget.category_name} budget is already exceeded at creation.`, { budget_id: budget.id });
  } else if (enriched.near_limit) {
    await NotificationModel.create(userId, 'budget_alert', 'Budget Near Limit',
      `Your ${budget.category_name} budget is ${enriched.percentage}% used.`, { budget_id: budget.id });
  }

  await ActivityModel.create(userId, 'created', 'budget', result.id, `Created ${budget.category_name} budget for ${data.month}/${data.year}`, null, ip);
  return enriched;
};

const updateBudget = async (userId, id, data, ip = null) => {
  const budget = await BudgetModel.findById(id);
  if (!budget || budget.user_id !== userId) throw new NotFoundError('Budget not found');

  if (data.category_id || data.month || data.year) {
    const category = await CategoryModel.findById(data.category_id || budget.category_id);
    if (!category || (category.user_id !== userId && category.is_default !== 1)) throw new BadRequestError('Invalid category');
    if (category.type !== 'expense') throw new BadRequestError('Budgets can only be set for expense categories');
    const dup = await BudgetModel.findByUserAndCategory(userId, data.category_id || budget.category_id, data.month || budget.month, data.year || budget.year);
    if (dup && dup.id !== id) throw new ConflictError('A budget for this category already exists for this month');
  }

  if (data.amount !== undefined && data.amount <= 0) throw new BadRequestError('Budget amount must be positive');

  await BudgetModel.update(id, data);
  await BudgetModel.recalculateSpent(userId, data.month || budget.month, data.year || budget.year);
  await ActivityModel.create(userId, 'updated', 'budget', id, `Updated budget`, null, ip);
  return enrichBudget(await BudgetModel.findById(id));
};

const deleteBudget = async (userId, id, ip = null) => {
  const budget = await BudgetModel.findById(id);
  if (!budget || budget.user_id !== userId) throw new NotFoundError('Budget not found');
  await BudgetModel.delete(id);
  await ActivityModel.create(userId, 'deleted', 'budget', id, `Deleted budget: ${budget.category_name}`, null, ip);
  return true;
};

const getBudgetAlerts = async (userId, month, year) => {
  const { month: curMonth, year: curYear } = getCurrentMonth();
  const m = parseInt(month) || curMonth;
  const y = parseInt(year) || curYear;

  await BudgetModel.recalculateSpent(userId, m, y);
  const nearLimit = await BudgetModel.getNearLimit(userId, m, y);
  const exceeded = await BudgetModel.getExceeded(userId, m, y);

  return {
    near_limit: nearLimit.map((b) => ({ ...enrichBudget(b) })),
    exceeded: exceeded.map((b) => ({ ...enrichBudget(b) }))
  };
};

module.exports = { getBudgets, getBudget, createBudget, updateBudget, deleteBudget, getBudgetAlerts, enrichBudget };
