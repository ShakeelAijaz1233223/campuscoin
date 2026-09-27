const express = require('express');
const router = express.Router();
const insightController = require('../controllers/insight.controller');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { param } = require('express-validator');

router.use(authenticate);
router.get('/', insightController.getInsights);
router.get('/latest', insightController.getLatest);
router.get('/month/:month/:year',
  param('month').isInt({ min: 1, max: 12 }), param('year').isInt({ min: 2000, max: 2100 }),
  validate, insightController.getInsightByMonth);
router.get('/:id', param('id').isInt({ min: 1 }), validate, insightController.getInsight);
router.post('/generate', insightController.generateInsight);

module.exports = router;
