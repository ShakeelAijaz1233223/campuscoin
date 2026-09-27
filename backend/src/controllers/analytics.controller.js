const asyncHandler = require('../utils/asyncHandler');
const analyticsService = require('../services/analytics.service');
const { sendSuccess } = require('../utils/response');
const { getMonthRange } = require('../utils/dates');

const getCategorySpending = asyncHandler(async (req, res) => {
  const { startDate, endDate } = resolveRange(req);
  const data = await analyticsService.getCategorySpending(req.user.id, startDate, endDate);
  return sendSuccess(res, { categories: data, start_date: startDate, end_date: endDate }, 'Category spending retrieved');
});

const getDailySpending = asyncHandler(async (req, res) => {
  const { startDate, endDate } = resolveRange(req);
  const data = await analyticsService.getDailySpending(req.user.id, startDate, endDate);
  return sendSuccess(res, { daily: data, start_date: startDate, end_date: endDate }, 'Daily spending retrieved');
});

const getWeeklySpending = asyncHandler(async (req, res) => {
  const { startDate, endDate } = resolveRange(req);
  const data = await analyticsService.getWeeklySpending(req.user.id, startDate, endDate);
  return sendSuccess(res, { weekly: data, start_date: startDate, end_date: endDate }, 'Weekly spending retrieved');
});

const getMonthlySpending = asyncHandler(async (req, res) => {
  const months = parseInt(req.query.months) || 12;
  const data = await analyticsService.getMonthlySpending(req.user.id, months);
  return sendSuccess(res, { monthly: data }, 'Monthly spending retrieved');
});

const getSixMonthOverview = asyncHandler(async (req, res) => {
  const data = await analyticsService.getSixMonthOverview(req.user.id);
  return sendSuccess(res, data, 'Six-month overview retrieved');
});

const getHistoricalAverages = asyncHandler(async (req, res) => {
  const data = await analyticsService.getHistoricalAverages(req.user.id, parseInt(req.query.months) || 6);
  return sendSuccess(res, data, 'Historical averages retrieved');
});

const getCategoryGrowth = asyncHandler(async (req, res) => {
  const data = await analyticsService.getCategoryGrowth(req.user.id, 2);
  return sendSuccess(res, { categories: data }, 'Category growth retrieved');
});

const getTrends = asyncHandler(async (req, res) => {
  const data = await analyticsService.getPersonalTrends(req.user.id);
  return sendSuccess(res, data, 'Personal spending trends retrieved');
});

const getBudgetConsumption = asyncHandler(async (req, res) => {
  const data = await analyticsService.getBudgetConsumption(req.user.id, req.query.month, req.query.year);
  return sendSuccess(res, { budgets: data }, 'Budget consumption retrieved');
});

const getSavingsRate = asyncHandler(async (req, res) => {
  const data = await analyticsService.getSavingsRate(req.user.id, parseInt(req.query.months) || 6);
  return sendSuccess(res, { history: data }, 'Savings rate retrieved');
});

const resolveRange = (req) => {
  if (req.query.start_date && req.query.end_date) {
    return { startDate: req.query.start_date, endDate: req.query.end_date };
  }
  const now = new Date();
  return getMonthRange(now.getFullYear(), now.getMonth() + 1);
};

module.exports = {
  getCategorySpending, getDailySpending, getWeeklySpending, getMonthlySpending,
  getSixMonthOverview, getHistoricalAverages, getCategoryGrowth, getTrends,
  getBudgetConsumption, getSavingsRate
};
