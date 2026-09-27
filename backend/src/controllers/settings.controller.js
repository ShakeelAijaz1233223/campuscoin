const asyncHandler = require('../utils/asyncHandler');
const settingsService = require('../services/settings.service');
const { sendSuccess } = require('../utils/response');

const getSettings = asyncHandler(async (req, res) => {
  const settings = await settingsService.getSettings(req.user.id);
  return sendSuccess(res, { settings }, 'Settings retrieved');
});

const updateSettings = asyncHandler(async (req, res) => {
  const settings = await settingsService.updateSettings(req.user.id, req.body);
  return sendSuccess(res, { settings }, 'Settings updated');
});

module.exports = { getSettings, updateSettings };
