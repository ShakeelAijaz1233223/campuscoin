const express = require('express');
const router = express.Router();
const exportController = require('../controllers/export.controller');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);
router.get('/transactions/csv', exportController.exportCSV);
router.get('/transactions/json', exportController.exportJSON);
router.get('/download/:filename', exportController.downloadReport);

module.exports = router;
