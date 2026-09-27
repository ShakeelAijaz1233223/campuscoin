const asyncHandler = require('../utils/asyncHandler');
const aiService = require('../services/ai.service');
const { sendSuccess, sendCreated, sendPaginated } = require('../utils/response');

const suggest = asyncHandler(async (req, res) => {
  const suggestion = await aiService.suggestCategory(
    req.user.id,
    req.body.description,
    req.body.type || 'expense'
  );
  return sendSuccess(res, { suggestion, advisory: true }, 'AI category suggestion generated');
});

const suggestBatch = asyncHandler(async (req, res) => {
  const suggestions = await aiService.suggestBatch(
    req.user.id,
    req.body.descriptions || [],
    req.body.type || 'expense'
  );
  return sendSuccess(res, { suggestions, advisory: true }, 'Batch AI suggestions generated');
});

const recordCorrection = asyncHandler(async (req, res) => {
  const result = await aiService.recordCorrection(req.user.id, req.body);
  return sendCreated(res, result, 'Correction recorded — AI will learn from it');
});

const getCorrections = asyncHandler(async (req, res) => {
  const { getPagination, buildPaginationMeta } = require('../utils/pagination');
  const pagination = getPagination(req.query);
  const { records, total } = await aiService.getCorrectionHistory(req.user.id, pagination);
  const meta = buildPaginationMeta(total, pagination.page, pagination.limit);
  return sendPaginated(res, { corrections: records }, meta, 'AI correction history retrieved');
});

const getSuggestions = asyncHandler(async (req, res) => {
  const { getPagination, buildPaginationMeta } = require('../utils/pagination');
  const pagination = getPagination(req.query);
  const { records, total } = await aiService.getSuggestionHistory(req.user.id, pagination);
  const meta = buildPaginationMeta(total, pagination.page, pagination.limit);
  return sendPaginated(res, { suggestions: records }, meta, 'AI suggestion history retrieved');
});

const getStatus = asyncHandler(async (req, res) => {
  const status = aiService.getStatus();
  return sendSuccess(res, status, 'AI service status retrieved');
});

module.exports = { suggest, suggestBatch, recordCorrection, getCorrections, getSuggestions, getStatus };
