const asyncHandler = require('../utils/asyncHandler');
const bookmarkService = require('../services/bookmark.service');
const { sendSuccess, sendCreated, sendPaginated } = require('../utils/response');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');

const getAllBookmarks = asyncHandler(async (req, res) => {
  const bookmarks = await bookmarkService.getAllBookmarks(req.user.id);
  return sendSuccess(res, bookmarks, 'Bookmarks retrieved');
});

// Tips
const getTipBookmarks = asyncHandler(async (req, res) => {
  const pagination = getPagination(req.query);
  const { bookmarks, total } = await bookmarkService.getTipBookmarks(req.user.id, pagination);
  const meta = buildPaginationMeta(total, pagination.page, pagination.limit);
  return sendPaginated(res, { bookmarks }, meta, 'Tip bookmarks retrieved');
});

const addTipBookmark = asyncHandler(async (req, res) => {
  const result = await bookmarkService.addTipBookmark(req.user.id, parseInt(req.params.tipId));
  return sendCreated(res, { bookmark: result }, 'Tip bookmarked');
});

const removeTipBookmark = asyncHandler(async (req, res) => {
  await bookmarkService.removeTipBookmark(req.user.id, parseInt(req.params.tipId));
  return sendSuccess(res, null, 'Tip bookmark removed');
});

// Insights
const getInsightBookmarks = asyncHandler(async (req, res) => {
  const pagination = getPagination(req.query);
  const { bookmarks, total } = await bookmarkService.getInsightBookmarks(req.user.id, pagination);
  const meta = buildPaginationMeta(total, pagination.page, pagination.limit);
  return sendPaginated(res, { bookmarks }, meta, 'Insight bookmarks retrieved');
});

const addInsightBookmark = asyncHandler(async (req, res) => {
  const result = await bookmarkService.addInsightBookmark(req.user.id, parseInt(req.params.insightId));
  return sendCreated(res, { bookmark: result }, 'Insight bookmarked');
});

const removeInsightBookmark = asyncHandler(async (req, res) => {
  await bookmarkService.removeInsightBookmark(req.user.id, parseInt(req.params.insightId));
  return sendSuccess(res, null, 'Insight bookmark removed');
});

module.exports = {
  getAllBookmarks, getTipBookmarks, addTipBookmark, removeTipBookmark,
  getInsightBookmarks, addInsightBookmark, removeInsightBookmark
};
