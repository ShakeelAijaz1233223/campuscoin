const express = require('express');
const router = express.Router();
const bookmarkController = require('../controllers/bookmark.controller');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { param } = require('express-validator');

router.use(authenticate);
router.get('/', bookmarkController.getAllBookmarks);
router.get('/tips', bookmarkController.getTipBookmarks);
router.post('/tips/:tipId', param('tipId').isInt({ min: 1 }), validate, bookmarkController.addTipBookmark);
router.delete('/tips/:tipId', param('tipId').isInt({ min: 1 }), validate, bookmarkController.removeTipBookmark);
router.get('/insights', bookmarkController.getInsightBookmarks);
router.post('/insights/:insightId', param('insightId').isInt({ min: 1 }), validate, bookmarkController.addInsightBookmark);
router.delete('/insights/:insightId', param('insightId').isInt({ min: 1 }), validate, bookmarkController.removeInsightBookmark);

module.exports = router;
