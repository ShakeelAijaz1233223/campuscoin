const express = require('express');
const router = express.Router();
const noteController = require('../controllers/note.controller');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { body, param } = require('express-validator');

const createNoteValidator = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 300 }),
  body('content').trim().notEmpty().withMessage('Content is required'),
  body('color').optional({ values: 'falsy' }).isLength({ max: 20 }),
  body('is_pinned').optional().isBoolean()
];

const updateNoteValidator = [
  param('id').isInt({ min: 1 }).withMessage('Invalid note id'),
  body('title').optional().trim().notEmpty().isLength({ max: 300 }),
  body('content').optional().trim().notEmpty(),
  body('color').optional({ values: 'falsy' }).isLength({ max: 20 }),
  body('is_pinned').optional().isBoolean(),
  body('status').optional().isIn(['active', 'archived'])
];

const noteIdValidator = [param('id').isInt({ min: 1 }).withMessage('Invalid note id')];

router.use(authenticate);
router.get('/', noteController.getNotes);
router.get('/:id', noteIdValidator, validate, noteController.getNote);
router.post('/', createNoteValidator, validate, noteController.createNote);
router.put('/:id', updateNoteValidator, validate, noteController.updateNote);
router.patch('/:id', updateNoteValidator, validate, noteController.updateNote);
router.delete('/:id', noteIdValidator, validate, noteController.deleteNote);

module.exports = router;
