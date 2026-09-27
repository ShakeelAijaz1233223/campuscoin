const asyncHandler = require('../utils/asyncHandler');
const searchService = require('../services/search.service');
const { sendSuccess } = require('../utils/response');

const search = asyncHandler(async (req, res) => {
  const result = await searchService.globalSearch(req.user.id, req.query.q || '', req.query.types || '');
  return sendSuccess(res, result, 'Search completed');
});

module.exports = { search };
