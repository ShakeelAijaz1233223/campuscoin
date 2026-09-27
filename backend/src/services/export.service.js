const fs = require('fs');
const path = require('path');

const TransactionModel = require('../models/transaction.model');
const { getExportFile } = require('./report.service');
const { NotFoundError } = require('../utils/errors');

const EXPORTS_DIR = path.join(__dirname, '../../exports');

const csvEscape = (value) => {
  const s = value === null || value === undefined ? '' : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

const toCSV = (records, fields) => {
  const header = fields.join(',');
  const rows = records.map((r) => fields.map((f) => csvEscape(r[f])).join(','));
  return `${header}\n${rows.join('\n')}`;
};

/**
 * Export the user's transactions as CSV with optional filters.
 * Returns { filePath, filename } for streaming to the client.
 */
const exportTransactionsCSV = async (userId, filters = {}) => {
  const { transactions } = await TransactionModel.findByUser(userId, { ...filters, page: 1, limit: 10000 });

  const fields = ['date', 'type', 'amount', 'description', 'category_name', 'account_name', 'notes', 'created_at'];
  const records = transactions.map((t) => ({
    date: t.date,
    type: t.type,
    amount: t.amount,
    description: t.description,
    category_name: t.category_name || 'Uncategorized',
    account_name: t.account_name || '',
    notes: t.notes || '',
    created_at: t.created_at
  }));

  const csv = toCSV(records, fields);
  const filename = `transactions_export_${userId}_${Date.now()}.csv`;
  const filePath = path.join(EXPORTS_DIR, filename);
  fs.mkdirSync(EXPORTS_DIR, { recursive: true });
  fs.writeFileSync(filePath, csv);

  // Auto cleanup after 30 minutes
  setTimeout(() => fs.unlink(filePath, () => {}), 30 * 60 * 1000).unref();

  return { filePath, filename, count: records.length };
};

const exportTransactionsJSON = async (userId, filters = {}) => {
  const { transactions } = await TransactionModel.findByUser(userId, { ...filters, page: 1, limit: 10000 });
  const filename = `transactions_export_${userId}_${Date.now()}.json`;
  const filePath = path.join(EXPORTS_DIR, filename);
  fs.mkdirSync(EXPORTS_DIR, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify({ exported_at: new Date().toISOString(), count: transactions.length, transactions }, null, 2));
  setTimeout(() => fs.unlink(filePath, () => {}), 30 * 60 * 1000).unref();
  return { filePath, filename, count: transactions.length };
};

const getFileStream = (filename) => {
  const filePath = getExportFile(filename);
  if (!filePath) throw new NotFoundError('Export file not found or expired');
  return filePath;
};

module.exports = { exportTransactionsCSV, exportTransactionsJSON, getFileStream, EXPORTS_DIR };
