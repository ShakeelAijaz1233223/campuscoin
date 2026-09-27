const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const AnnouncementModel = require('../models/announcement.model');
const TipModel = require('../models/tip.model');
const { sendSuccess } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Public content endpoints for the frontend:
 * active announcements + system saving tips (used by dashboard & content pages).
 */
router.get('/announcements', authenticate, asyncHandler(async (req, res) => {
  const announcements = await AnnouncementModel.findActive();
  return sendSuccess(res, { announcements }, 'Announcements retrieved');
}));

router.get('/tips', authenticate, asyncHandler(async (req, res) => {
  const tips = await TipModel.findAll({ limit: 50 });
  return sendSuccess(res, { tips: tips.tips }, 'Content tips retrieved');
}));

module.exports = router;
