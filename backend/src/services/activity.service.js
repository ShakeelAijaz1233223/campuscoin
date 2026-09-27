const ActivityModel = require('../models/activity.model');

const getActivities = async (userId, filters) => {
  const { activities, total } = await ActivityModel.findByUser(userId, filters);
  return { activities, total };
};

const getRecent = async (userId, limit = 10) => {
  return ActivityModel.findRecent(userId, limit);
};

module.exports = { getActivities, getRecent };
