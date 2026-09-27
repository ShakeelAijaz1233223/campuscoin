const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);
router.get('/', require('../validators/budget.validator').budgetMonthValidator, require('../middleware/validate'), dashboardController.getDashboard);
router.get('/forecast', dashboardController.getForecast);

module.exports = router;
