const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { body } = require('express-validator');

router.use(authenticate);

router.get('/status', aiController.getStatus);
router.post('/suggest',
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('type').optional().isIn(['income', 'expense']),
  validate, aiController.suggest);
router.post('/suggest-batch',
  body('descriptions').isArray({ min: 1 }).withMessage('descriptions must be a non-empty array'),
  body('descriptions.*').isString(),
  body('type').optional().isIn(['income', 'expense']),
  validate, aiController.suggestBatch);
router.post('/corrections',
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('corrected_category_id').isInt({ min: 1 }).withMessage('Valid corrected_category_id is required'),
  body('original_category_id').optional({ values: 'falsy' }).isInt({ min: 1 }),
  validate, aiController.recordCorrection);
router.get('/corrections', aiController.getCorrections);
router.get('/suggestions', aiController.getSuggestions);

module.exports = router;
