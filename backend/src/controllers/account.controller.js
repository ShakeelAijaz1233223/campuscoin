const asyncHandler = require('../utils/asyncHandler');
const accountService = require('../services/account.service');
const { sendSuccess, sendCreated } = require('../utils/response');

const getAccounts = asyncHandler(async (req, res) => {
  const data = await accountService.getAccounts(req.user.id);
  return sendSuccess(res, data, 'Accounts retrieved');
});

const getAccount = asyncHandler(async (req, res) => {
  const account = await accountService.getAccount(req.user.id, parseInt(req.params.id));
  return sendSuccess(res, { account }, 'Account retrieved');
});

const createAccount = asyncHandler(async (req, res) => {
  const account = await accountService.createAccount(req.user.id, req.body);
  return sendCreated(res, { account }, 'Account created successfully');
});

const updateAccount = asyncHandler(async (req, res) => {
  const account = await accountService.updateAccount(req.user.id, parseInt(req.params.id), req.body);
  return sendSuccess(res, { account }, 'Account updated successfully');
});

const deleteAccount = asyncHandler(async (req, res) => {
  await accountService.deleteAccount(req.user.id, parseInt(req.params.id));
  return sendSuccess(res, null, 'Account deleted successfully');
});

module.exports = { getAccounts, getAccount, createAccount, updateAccount, deleteAccount };
