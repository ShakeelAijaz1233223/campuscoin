const asyncHandler = require('../utils/asyncHandler');
const goalService = require('../services/goal.service');
const { sendSuccess, sendCreated, sendPaginated } = require('../utils/response');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');

const getGoals = asyncHandler(async (req, res) => {
  const pagination = getPagination(req.query);
  const result = await goalService.getGoals(req.user.id, { status: req.query.status || '', ...pagination });
  const meta = buildPaginationMeta(result.total, pagination.page, pagination.limit);
  return sendPaginated(res, { goals: result.goals, summary: result.summary }, meta, 'Goals retrieved');
});

const getGoal = asyncHandler(async (req, res) => {
  const goal = await goalService.getGoal(req.user.id, parseInt(req.params.id));
  return sendSuccess(res, { goal }, 'Goal retrieved');
});

const createGoal = asyncHandler(async (req, res) => {
  const goal = await goalService.createGoal(req.user.id, req.body, req.ip);
  return sendCreated(res, { goal }, 'Goal created successfully');
});

const updateGoal = asyncHandler(async (req, res) => {
  const goal = await goalService.updateGoal(req.user.id, parseInt(req.params.id), req.body, req.ip);
  return sendSuccess(res, { goal }, 'Goal updated successfully');
});

const deleteGoal = asyncHandler(async (req, res) => {
  await goalService.deleteGoal(req.user.id, parseInt(req.params.id), req.ip);
  return sendSuccess(res, null, 'Goal deleted successfully');
});

const contribute = asyncHandler(async (req, res) => {
  const result = await goalService.contribute(req.user.id, parseInt(req.params.id), req.body, req.ip);
  return sendCreated(res, result, 'Contribution added successfully');
});

const getContributions = asyncHandler(async (req, res) => {
  const contributions = await goalService.getContributions(req.user.id, parseInt(req.params.id));
  return sendSuccess(res, { contributions }, 'Contributions retrieved');
});

const deleteContribution = asyncHandler(async (req, res) => {
  await goalService.deleteContribution(req.user.id, parseInt(req.params.id), parseInt(req.params.contributionId));
  return sendSuccess(res, null, 'Contribution removed successfully');
});

module.exports = { getGoals, getGoal, createGoal, updateGoal, deleteGoal, contribute, getContributions, deleteContribution };
