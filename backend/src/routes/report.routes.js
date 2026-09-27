const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { monthlyReportValidator, rangeReportValidator } = require('../validators/report.validator');

router.use(authenticate);
router.get('/monthly', monthlyReportValidator, validate, reportController.getMonthlyReport);
router.get('/range', rangeReportValidator, validate, reportController.getRangeReport);
router.get('/monthly/pdf', monthlyReportValidator, validate, reportController.exportMonthlyPDF);

module.exports = router;
