const asyncHandler = require('../utils/asyncHandler');
const recurringService = require('../services/recurring.service');
const { sendSuccess, sendCreated, sendPaginated } = require('../utils/response');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');

const getRecurring = asyncHandler(async (req, res) => {
  const pagination = getPagination(req.query);
  const result = await recurringService.getRecurring(req.user.id, {
    status: req.query.status || '',
    ...pagination
  });
  const meta = buildPaginationMeta(result.total, pagination.page, pagination.limit);
  return sendPaginated(res, { recurring_transactions: result.recurring }, meta, 'Recurring transactions retrieved');
});

const getRecurringById = asyncHandler(async (req, res) => {
  const recurring = await recurringService.getRecurringById(req.user.id, parseInt(req.params.id));
  return sendSuccess(res, { recurring_transaction: recurring }, 'Recurring transaction retrieved');
});

const createRecurring = asyncHandler(async (req, res) => {
  const recurring = await recurringService.createRecurring(req.user.id, req.body, req.ip);
  return sendCreated(res, { recurring_transaction: recurring }, 'Recurring transaction created successfully');
});

const updateRecurring = asyncHandler(async (req, res) => {
  const recurring = await recurringService.updateRecurring(req.user.id, parseInt(req.params.id), req.body, req.ip);
  return sendSuccess(res, { recurring_transaction: recurring }, 'Recurring transaction updated successfully');
});

const deleteRecurring = asyncHandler(async (req, res) => {
  await recurringService.deleteRecurring(req.user.id, parseInt(req.params.id), req.ip);
  return sendSuccess(res, null, 'Recurring transaction deleted successfully');
});

const toggleRecurring = asyncHandler(async (req, res) => {
  const recurring = await recurringService.toggleRecurring(req.user.id, parseInt(req.params.id), req.body.is_active);
  return sendSuccess(res, { recurring_transaction: recurring }, `Recurring transaction ${req.body.is_active ? 'activated' : 'deactivated'}`);
});

const processNow = asyncHandler(async (req, res) => {
  const result = await recurringService.processDueRecurring(req.user.id);
  return sendSuccess(res, result, 'Due recurring transactions processed');
});

module.exports = { getRecurring, getRecurringById, createRecurring, updateRecurring, deleteRecurring, toggleRecurring, processNow };
