const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const authenticate = require('../middleware/authenticate');
const { dateIsValid } = require('../validators/transaction.validator');

router.use(authenticate);
router.get('/category-spending', analyticsController.getCategorySpending);
router.get('/daily-spending', analyticsController.getDailySpending);
router.get('/weekly-spending', analyticsController.getWeeklySpending);
router.get('/monthly-spending', analyticsController.getMonthlySpending);
router.get('/six-month-overview', analyticsController.getSixMonthOverview);
router.get('/historical-averages', analyticsController.getHistoricalAverages);
router.get('/category-growth', analyticsController.getCategoryGrowth);
router.get('/trends', analyticsController.getTrends);
router.get('/budget-consumption', analyticsController.getBudgetConsumption);
router.get('/savings-rate', analyticsController.getSavingsRate);

module.exports = router;
