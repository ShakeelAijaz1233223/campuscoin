const SettingModel = require('../models/setting.model');
const ProfileModel = require('../models/profile.model');
const db = require('../config/database');

const ALLOWED_SETTINGS = [
  'currency',
  'theme',
  'language',
  'date_format',
  'notifications_enabled',
  'email_notifications',
  'weekly_report',
  'default_account_id'
];

const getSettings = async (userId) => {
  const profile = await ProfileModel.findByUserId(userId);
  const settings = await SettingModel.getAll(userId);
  const map = {};
  for (const s of settings) map[s.setting_key] = s.setting_value;
  return {
    notifications_enabled: true,
    email_notifications: false,
    weekly_report: false,
    currency: profile?.currency || 'PKR',
    theme: profile?.theme || 'light',
    language: profile?.language || 'en',
    date_format: profile?.date_format || 'YYYY-MM-DD',
    monthly_allowance: profile?.monthly_allowance || 0,
    monthly_savings_goal: profile?.monthly_savings_goal || 0,
    ...map
  };
};

const updateSettings = async (userId, data) => {
  // Profile-managed fields go to profiles; others to settings key-value
  const profileFields = {};
  if (data.currency !== undefined) profileFields.currency = data.currency;
  if (data.theme !== undefined) profileFields.theme = data.theme;
  if (data.language !== undefined) profileFields.language = data.language;
  if (data.date_format !== undefined)
    profileFields.date_format = data.date_format;
  if (data.monthly_allowance !== undefined)
    profileFields.monthly_allowance = data.monthly_allowance;
  if (data.monthly_savings_goal !== undefined)
    profileFields.monthly_savings_goal = data.monthly_savings_goal;

  if (Object.keys(profileFields).length > 0) {
    await ProfileModel.update(userId, profileFields);
  }

  const kv = {};
  for (const key of ALLOWED_SETTINGS) {
    if (data[key] !== undefined) {
      if (!(key in profileFields)) kv[key] = data[key];
    }
  }
  if (Object.keys(kv).length > 0) {
    await SettingModel.setMany(userId, kv);
  }

  return getSettings(userId);
};

module.exports = { getSettings, updateSettings };
