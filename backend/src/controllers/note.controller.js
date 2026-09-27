const asyncHandler = require('../utils/asyncHandler');
const noteService = require('../services/note.service');
const { sendSuccess, sendCreated, sendPaginated } = require('../utils/response');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');

const getNotes = asyncHandler(async (req, res) => {
  const pagination = getPagination(req.query);
  const result = await noteService.getNotes(req.user.id, { status: req.query.status || 'active', ...pagination });
  const meta = buildPaginationMeta(result.total, pagination.page, pagination.limit);
  return sendPaginated(res, { notes: result.notes }, meta, 'Notes retrieved');
});

const getNote = asyncHandler(async (req, res) => {
  const note = await noteService.getNote(req.user.id, parseInt(req.params.id));
  return sendSuccess(res, { note }, 'Note retrieved');
});

const createNote = asyncHandler(async (req, res) => {
  const note = await noteService.createNote(req.user.id, req.body);
  return sendCreated(res, { note }, 'Note created successfully');
});

const updateNote = asyncHandler(async (req, res) => {
  const note = await noteService.updateNote(req.user.id, parseInt(req.params.id), req.body);
  return sendSuccess(res, { note }, 'Note updated successfully');
});

const deleteNote = asyncHandler(async (req, res) => {
  await noteService.deleteNote(req.user.id, parseInt(req.params.id));
  return sendSuccess(res, null, 'Note deleted successfully');
});

module.exports = { getNotes, getNote, createNote, updateNote, deleteNote };
