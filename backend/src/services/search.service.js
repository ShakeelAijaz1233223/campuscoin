const TransactionModel = require('../models/transaction.model');
const CategoryModel = require('../models/category.model');
const BillModel = require('../models/bill.model');
const GoalModel = require('../models/goal.model');
const TipModel = require('../models/tip.model');
const InsightModel = require('../models/insight.model');
const NoteModel = require('../models/note.model');

/**
 * Global authenticated search across the user's own entities.
 * Returns structured result groups.
 */
const globalSearch = async (userId, query, types = '') => {
  const q = String(query || '').trim();
  if (!q) return { query: '', results: {}, total_results: 0 };

  const like = `%${q}%`;
  const wanted = types ? types.split(',').map((t) => t.trim().toLowerCase()) : null;
  const want = (type) => !wanted || wanted.includes(type);
  const results = {};

  if (want('transactions')) {
    results.transactions = (await TransactionModel.search(userId, q)).slice(0, 10);
  }
  if (want('categories')) {
    const cats = await CategoryModel.findByUser(userId, {});
    results.categories = cats.filter((c) => c.name.toLowerCase().includes(q.toLowerCase())).slice(0, 10);
  }
  if (want('bills')) {
    results.bills = await BillModel.search(userId, q);
  }
  if (want('goals')) {
    const goals = await GoalModel.findByUser(userId, { limit: 100 });
    results.goals = goals.goals.filter((g) => g.name.toLowerCase().includes(q.toLowerCase()) || (g.description || '').toLowerCase().includes(q.toLowerCase())).slice(0, 10);
  }
  if (want('tips')) {
    results.tips = await TipModel.search(q);
  }
  if (want('insights')) {
    results.insights = (await InsightModel.search(userId, q)).slice(0, 10);
  }
  if (want('notes')) {
    results.notes = await NoteModel.search(userId, q);
  }

  const total = Object.values(results).reduce((s, arr) => s + (Array.isArray(arr) ? arr.length : 0), 0);
  return { query: q, results, total_results: total };
};

module.exports = { globalSearch };
