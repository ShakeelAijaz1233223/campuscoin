const asyncHandler = require('../utils/asyncHandler');
const dashboardService = require('../services/dashboard.service');
const forecastService = require('../services/forecast.service');
const { sendSuccess } = require('../utils/response');

const getDashboard = asyncHandler(async (req, res) => {
  const data = await dashboardService.getDashboard(req.user.id, req.query.month, req.query.year);
  return sendSuccess(res, data, 'Dashboard data retrieved');
});

const getForecast = asyncHandler(async (req, res) => {
  const forecast = await forecastService.getUpcomingMonthForecast(req.user.id);
  return sendSuccess(res, forecast, 'Forecast retrieved');
});

module.exports = { getDashboard, getForecast };
