const UserModel = require('../models/user.model');
const ProfileModel = require('../models/profile.model');
const ActivityModel = require('../models/activity.model');
const SettingModel = require('../models/setting.model');
const { NotFoundError } = require('../utils/errors');

const getProfile = async (userId) => {
  const user = await UserModel.findById(userId);
  if (!user) throw new NotFoundError('User not found');
  let profile = await ProfileModel.findByUserId(userId);
  if (!profile) {
    await ProfileModel.create(userId, { first_name: 'User' });
    profile = await ProfileModel.findByUserId(userId);
  }
  const preferences = await SettingModel.getAll(userId);
  return { user, profile, preferences };
};

const updateProfile = async (userId, data) => {
  const user = await UserModel.findById(userId);
  if (!user) throw new NotFoundError('User not found');

  let profile = await ProfileModel.findByUserId(userId);
  if (!profile) {
    await ProfileModel.create(userId, { first_name: data.first_name || 'User' });
    profile = await ProfileModel.findByUserId(userId);
  }

  await ProfileModel.update(userId, data);
  const updated = await ProfileModel.findByUserId(userId);
  await ActivityModel.create(userId, 'updated', 'profile', profile.id, 'Profile updated');
  return updated;
};

const updatePreferences = async (userId, prefs) => {
  await SettingModel.setMany(userId, prefs);
  return SettingModel.getAll(userId);
};

const getPreferences = async (userId) => {
  return SettingModel.getAll(userId);
};

module.exports = { getProfile, updateProfile, updatePreferences, getPreferences };
