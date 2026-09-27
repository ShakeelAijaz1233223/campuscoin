const express = require('express');
const router = express.Router();
const tipController = require('../controllers/tip.controller');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { body, param } = require('express-validator');

router.use(authenticate);
router.get('/personalized', tipController.getPersonalizedTips);
router.get('/history', tipController.getHistory);
router.get('/', tipController.getSystemTips);
router.get('/:id', param('id').isInt({ min: 1 }), validate, tipController.getTip);
router.post('/dismiss', body('tip_title').optional().isString(), body('tip_id').optional().isInt(), validate, tipController.dismissTip);
router.post('/pin', body('tip_title').optional().isString(), body('tip_id').optional().isInt(), validate, tipController.pinTip);

module.exports = router;
