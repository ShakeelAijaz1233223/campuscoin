const asyncHandler = require('../utils/asyncHandler');
const reportService = require('../services/report.service');
const { sendSuccess } = require('../utils/response');

const getMonthlyReport = asyncHandler(async (req, res) => {
  const now = new Date();
  const year = parseInt(req.query.year) || now.getFullYear();
  const month = parseInt(req.query.month) || now.getMonth() + 1;
  const report = await reportService.getMonthlyReportWithBudgets(
    req.user.id,
    year,
    month
  );
  return sendSuccess(res, { report }, 'Monthly report retrieved');
});

const getRangeReport = asyncHandler(async (req, res) => {
  const report = await reportService.getRangeReport(
    req.user.id,
    req.query.start_date,
    req.query.end_date,
    req.query.group_by || 'daily',
    req.query.category_id || '',
    req.query.income_category_id || ''
  );
  // Browser charts do not need every underlying transaction in their payload.
  if (req.query.include_transactions === 'false') delete report.transactions;
  return sendSuccess(res, { report }, 'Range report retrieved');
});

const exportMonthlyPDF = asyncHandler(async (req, res) => {
  const now = new Date();
  const year = parseInt(req.query.year) || now.getFullYear();
  const month = parseInt(req.query.month) || now.getMonth() + 1;
  const result = await reportService.generateMonthlyPDF(
    req.user.id,
    year,
    month
  );
  return sendSuccess(
    res,
    {
      filename: result.filename,
      download_url: result.download_url
    },
    'PDF report generated'
  );
});

const exportRange = asyncHandler(async (req, res) => {
  const result = await reportService.exportRange(req.user.id, req.query);
  res.type(result.type);
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="campuscoin-report.${result.extension}"`
  );
  if (result.filePath) return res.sendFile(result.filePath);
  return res.send(result.body);
});

module.exports = {
  exportRange,
  getMonthlyReport,
  getRangeReport,
  exportMonthlyPDF
};
