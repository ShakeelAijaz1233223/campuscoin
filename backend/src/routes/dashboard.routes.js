const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);
router.get('/', dashboardController.getDashboard);
router.get('/forecast', dashboardController.getForecast);

module.exports = router;
