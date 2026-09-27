const NoteModel = require('../models/note.model');
const { NotFoundError, BadRequestError } = require('../utils/errors');

const getNotes = async (userId, filters) => {
  const { notes, total } = await NoteModel.findByUser(userId, filters);
  return { notes, total };
};

const getNote = async (userId, id) => {
  const note = await NoteModel.findById(id);
  if (!note || note.user_id !== userId) throw new NotFoundError('Note not found');
  return note;
};

const createNote = async (userId, data) => {
  if (!data.title || !data.title.trim()) throw new BadRequestError('Note title is required');
  if (!data.content || !data.content.trim()) throw new BadRequestError('Note content is required');
  const result = await NoteModel.create(userId, { ...data, title: data.title.trim(), content: data.content.trim() });
  return NoteModel.findById(result.id);
};

const updateNote = async (userId, id, data) => {
  await getNote(userId, id);
  await NoteModel.update(id, data);
  return NoteModel.findById(id);
};

const deleteNote = async (userId, id) => {
  await getNote(userId, id);
  await NoteModel.delete(id);
  return true;
};

module.exports = { getNotes, getNote, createNote, updateNote, deleteNote };
