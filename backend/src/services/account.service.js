const AccountModel = require('../models/account.model');
const ActivityModel = require('../models/activity.model');
const db = require('../config/database');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../utils/errors');

const getAccounts = async (userId) => {
  const accounts = await AccountModel.findByUser(userId);
  const total = await AccountModel.getTotalBalance(userId);
  return { accounts, total_balance: total };
};

const getAccount = async (userId, accountId) => {
  const account = await AccountModel.findById(accountId);
  if (!account || account.user_id !== userId) throw new NotFoundError('Account not found');
  return account;
};

const createAccount = async (userId, data) => {
  if (data.is_default) {
    await db.update('UPDATE accounts SET is_default = 0 WHERE user_id = ?', [userId]);
  } else {
    const count = await db.getOne('SELECT COUNT(*) as count FROM accounts WHERE user_id = ? AND status = ?', [userId, 'active']);
    if (count.count === 0) data.is_default = true;
  }
  const account = await AccountModel.create(userId, data);
  await ActivityModel.create(userId, 'created', 'account', account.id, `Created account: ${data.name}`);
  return AccountModel.findById(account.id);
};

const updateAccount = async (userId, accountId, data) => {
  const account = await AccountModel.findById(accountId);
  if (!account || account.user_id !== userId) throw new NotFoundError('Account not found');

  if (data.is_default) {
    await db.update('UPDATE accounts SET is_default = 0 WHERE user_id = ?', [userId]);
  }
  await AccountModel.update(accountId, data);
  await ActivityModel.create(userId, 'updated', 'account', accountId, `Updated account: ${account.name}`);
  return AccountModel.findById(accountId);
};

const deleteAccount = async (userId, accountId) => {
  const account = await AccountModel.findById(accountId);
  if (!account || account.user_id !== userId) throw new NotFoundError('Account not found');

  const txCount = await db.getOne('SELECT COUNT(*) as count FROM transactions WHERE account_id = ? AND status = ?', [accountId, 'active']);
  if (txCount.count > 0) {
    throw new BadRequestError('Cannot delete an account with transactions. Archive it instead to preserve history.');
  }

  const wasDefault = account.is_default === 1;
  await AccountModel.delete(accountId);

  if (wasDefault) {
    const next = await db.getOne(
      "SELECT id FROM accounts WHERE user_id = ? AND status = 'active' ORDER BY id ASC LIMIT 1",
      [userId]
    );
    if (next) await db.update('UPDATE accounts SET is_default = 1 WHERE id = ?', [next.id]);
  }

  await ActivityModel.create(userId, 'deleted', 'account', accountId, `Deleted account: ${account.name}`);
  return true;
};

module.exports = { getAccounts, getAccount, createAccount, updateAccount, deleteAccount };
