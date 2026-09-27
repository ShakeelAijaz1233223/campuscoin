const asyncHandler = require('../utils/asyncHandler');
const tipService = require('../services/tip.service');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');

const getPersonalizedTips = asyncHandler(async (req, res) => {
  const [tips, dismissed] = await Promise.all([
    tipService.getPersonalizedTips(req.user.id),
    tipService.getDismissedTips(req.user.id)
  ]);
  await tipService.saveTipHistory(req.user.id, tips);
  const visible = tips.filter((t) => !dismissed.includes(t.title));
  return sendSuccess(res, { tips: visible, advisory: true }, 'Personalized saving tips retrieved');
});

const getSystemTips = asyncHandler(async (req, res) => {
  const pagination = getPagination(req.query);
  const { tips, total } = await tipService.getSystemTips({ category: req.query.category || '', ...pagination });
  const meta = buildPaginationMeta(total, pagination.page, pagination.limit);
  return sendPaginated(res, { tips }, meta, 'Saving tips retrieved');
});

const getTip = asyncHandler(async (req, res) => {
  const tip = await tipService.getTip(parseInt(req.params.id));
  return sendSuccess(res, { tip }, 'Tip retrieved');
});

const dismissTip = asyncHandler(async (req, res) => {
  const result = await tipService.dismissTip(req.user.id, req.body.tip_title || String(req.body.tip_id || ''));
  return sendSuccess(res, result, 'Tip dismissed');
});

const pinTip = asyncHandler(async (req, res) => {
  const result = await tipService.pinTip(req.user.id, req.body.tip_title || String(req.body.tip_id || ''));
  return sendSuccess(res, result, 'Tip pinned');
});

const getHistory = asyncHandler(async (req, res) => {
  const history = await tipService.getTipHistory(req.user.id);
  return sendSuccess(res, { history }, 'Tip history retrieved');
});

module.exports = { getPersonalizedTips, getSystemTips, getTip, dismissTip, pinTip, getHistory };
