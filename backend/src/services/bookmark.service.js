const BookmarkModel = require('../models/bookmark.model');
const TipModel = require('../models/tip.model');
const InsightModel = require('../models/insight.model');
const { NotFoundError, ConflictError } = require('../utils/errors');

const getTipBookmarks = async (userId, filters) => {
  const { bookmarks, total } = await BookmarkModel.getTipBookmarks(userId, filters);
  return { bookmarks, total };
};

const addTipBookmark = async (userId, tipId) => {
  const tip = await TipModel.findById(tipId);
  if (!tip) throw new NotFoundError('Tip not found');
  const existing = await BookmarkModel.findTipBookmark(userId, tipId);
  if (existing) throw new ConflictError('Tip already bookmarked');
  return BookmarkModel.createTipBookmark(userId, tipId);
};

const removeTipBookmark = async (userId, tipId) => {
  const existing = await BookmarkModel.findTipBookmark(userId, tipId);
  if (!existing) throw new NotFoundError('Bookmark not found');
  await BookmarkModel.deleteTipBookmark(userId, tipId);
  return true;
};

const getInsightBookmarks = async (userId, filters) => {
  const { bookmarks, total } = await BookmarkModel.getInsightBookmarks(userId, filters);
  return { bookmarks, total };
};

const addInsightBookmark = async (userId, insightId) => {
  const insight = await InsightModel.findById(insightId);
  if (!insight || insight.user_id !== userId) throw new NotFoundError('Insight not found');
  const existing = await BookmarkModel.findInsightBookmark(userId, insightId);
  if (existing) throw new ConflictError('Insight already bookmarked');
  return BookmarkModel.createInsightBookmark(userId, insightId);
};

const removeInsightBookmark = async (userId, insightId) => {
  const existing = await BookmarkModel.findInsightBookmark(userId, insightId);
  if (!existing) throw new NotFoundError('Bookmark not found');
  await BookmarkModel.deleteInsightBookmark(userId, insightId);
  return true;
};

const getAllBookmarks = async (userId) => {
  const tips = await BookmarkModel.getTipBookmarks(userId, { limit: 100 });
  const insights = await BookmarkModel.getInsightBookmarks(userId, { limit: 100 });
  return { tips: tips.bookmarks, insights: insights.bookmarks };
};

module.exports = { getTipBookmarks, addTipBookmark, removeTipBookmark, getInsightBookmarks, addInsightBookmark, removeInsightBookmark, getAllBookmarks };
