const asyncHandler = require('../utils/asyncHandler');
const transactionService = require('../services/transaction.service');
const { sendSuccess, sendCreated, sendPaginated } = require('../utils/response');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');

const getTransactions = asyncHandler(async (req, res) => {
  const pagination = getPagination(req.query);
  const filters = {
    ...pagination,
    type: req.query.type || '',
    category_id: req.query.category_id ? parseInt(req.query.category_id) : '',
    account_id: req.query.account_id ? parseInt(req.query.account_id) : '',
    startDate: req.query.start_date || '',
    endDate: req.query.end_date || '',
    search: req.query.search || '',
    minAmount: req.query.min_amount ? parseFloat(req.query.min_amount) : '',
    maxAmount: req.query.max_amount ? parseFloat(req.query.max_amount) : '',
    sort: req.query.sort || 'date',
    order: req.query.order || 'DESC'
  };
  const result = await transactionService.getTransactions(req.user.id, filters);
  const meta = buildPaginationMeta(result.total, pagination.page, pagination.limit);
  return sendPaginated(res, { transactions: result.transactions, summary: result.summary }, meta, 'Transactions retrieved');
});

const getTransaction = asyncHandler(async (req, res) => {
  const transaction = await transactionService.getTransaction(req.user.id, parseInt(req.params.id));
  await transactionService.recordView(req.user.id, parseInt(req.params.id));
  return sendSuccess(res, { transaction }, 'Transaction retrieved');
});

const createTransaction = asyncHandler(async (req, res) => {
  const result = await transactionService.createTransaction(req.user.id, req.body, req.ip);
  return sendCreated(res, {
    transaction: result.transaction,
    duplicate_warning: result.duplicateWarning,
    ai_suggestion: result.aiSuggestion
  }, 'Transaction created successfully');
});

const updateTransaction = asyncHandler(async (req, res) => {
  const result = await transactionService.updateTransaction(req.user.id, parseInt(req.params.id), req.body, req.ip);
  return sendSuccess(res, { transaction: result.transaction }, 'Transaction updated successfully');
});

const deleteTransaction = asyncHandler(async (req, res) => {
  await transactionService.deleteTransaction(req.user.id, parseInt(req.params.id), req.ip);
  return sendSuccess(res, null, 'Transaction deleted successfully');
});

const getRecentlyViewed = asyncHandler(async (req, res) => {
  const transactions = await transactionService.getRecentlyViewed(req.user.id);
  return sendSuccess(res, { transactions }, 'Recently viewed transactions');
});

const getRecentlyEdited = asyncHandler(async (req, res) => {
  const transactions = await transactionService.getRecentlyEdited(req.user.id);
  return sendSuccess(res, { transactions }, 'Recently edited transactions');
});

const getUnusuallyLarge = asyncHandler(async (req, res) => {
  const transactions = await transactionService.getUnusuallyLarge(req.user.id);
  return sendSuccess(res, { transactions, advisory: true }, 'Unusually large transactions');
});

module.exports = { getTransactions, getTransaction, createTransaction, updateTransaction, deleteTransaction, getRecentlyViewed, getRecentlyEdited, getUnusuallyLarge };
