const asyncHandler = require('../utils/asyncHandler');
const budgetService = require('../services/budget.service');
const { sendSuccess, sendCreated } = require('../utils/response');

const getBudgets = asyncHandler(async (req, res) => {
  const data = await budgetService.getBudgets(req.user.id, req.query.month, req.query.year);
  return sendSuccess(res, data, 'Budgets retrieved');
});

const getBudget = asyncHandler(async (req, res) => {
  const budget = await budgetService.getBudget(req.user.id, parseInt(req.params.id));
  return sendSuccess(res, { budget }, 'Budget retrieved');
});

const createBudget = asyncHandler(async (req, res) => {
  const budget = await budgetService.createBudget(req.user.id, req.body, req.ip);
  return sendCreated(res, { budget }, 'Budget created successfully');
});

const updateBudget = asyncHandler(async (req, res) => {
  const budget = await budgetService.updateBudget(req.user.id, parseInt(req.params.id), req.body, req.ip);
  return sendSuccess(res, { budget }, 'Budget updated successfully');
});

const deleteBudget = asyncHandler(async (req, res) => {
  await budgetService.deleteBudget(req.user.id, parseInt(req.params.id), req.ip);
  return sendSuccess(res, null, 'Budget deleted successfully');
});

const getBudgetAlerts = asyncHandler(async (req, res) => {
  const alerts = await budgetService.getBudgetAlerts(req.user.id, req.query.month, req.query.year);
  return sendSuccess(res, alerts, 'Budget alerts retrieved');
});

module.exports = { getBudgets, getBudget, createBudget, updateBudget, deleteBudget, getBudgetAlerts };
