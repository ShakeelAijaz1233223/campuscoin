const asyncHandler = require('../utils/asyncHandler');
const profileService = require('../services/profile.service');
const { sendSuccess } = require('../utils/response');

const getProfile = asyncHandler(async (req, res) => {
  const data = await profileService.getProfile(req.user.id);
  return sendSuccess(res, data, 'Profile retrieved');
});

const updateProfile = asyncHandler(async (req, res) => {
  const profile = await profileService.updateProfile(req.user.id, req.body);
  return sendSuccess(res, { profile }, 'Profile updated successfully');
});

const getPreferences = asyncHandler(async (req, res) => {
  const preferences = await profileService.getPreferences(req.user.id);
  return sendSuccess(res, { preferences }, 'Preferences retrieved');
});

const updatePreferences = asyncHandler(async (req, res) => {
  const preferences = await profileService.updatePreferences(req.user.id, req.body);
  return sendSuccess(res, { preferences }, 'Preferences updated');
});

module.exports = { getProfile, updateProfile, getPreferences, updatePreferences };
