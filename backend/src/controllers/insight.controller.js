const asyncHandler = require('../utils/asyncHandler');
const insightService = require('../services/insight.service');
const { sendSuccess, sendCreated, sendPaginated } = require('../utils/response');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');

const generateInsight = asyncHandler(async (req, res) => {
  const insight = await insightService.generateInsight(req.user.id, req.body.month, req.body.year);
  return sendCreated(res, { insight, advisory: true }, 'AI insight generated');
});

const getInsights = asyncHandler(async (req, res) => {
  const pagination = getPagination(req.query);
  const result = await insightService.getInsights(req.user.id, pagination);
  const meta = buildPaginationMeta(result.total, pagination.page, pagination.limit);
  return sendPaginated(res, { insights: result.insights }, meta, 'Insights retrieved');
});

const getInsight = asyncHandler(async (req, res) => {
  const insight = await insightService.getInsight(req.user.id, parseInt(req.params.id));
  return sendSuccess(res, { insight, advisory: true }, 'Insight retrieved');
});

const getInsightByMonth = asyncHandler(async (req, res) => {
  const now = new Date();
  const month = parseInt(req.params.month) || now.getMonth() + 1;
  const year = parseInt(req.params.year) || now.getFullYear();
  const insight = await insightService.getInsightByMonth(req.user.id, month, year);
  return sendSuccess(res, { insight, advisory: true }, 'Insight retrieved');
});

const getLatest = asyncHandler(async (req, res) => {
  const insight = await insightService.getLatestInsight(req.user.id);
  return sendSuccess(res, { insight, advisory: true }, 'Latest insight retrieved');
});

module.exports = { generateInsight, getInsights, getInsight, getInsightByMonth, getLatest };
