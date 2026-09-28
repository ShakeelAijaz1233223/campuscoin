const asyncHandler = require('../utils/asyncHandler');
const exportService = require('../services/export.service');
const path = require('path');

const exportCSV = asyncHandler(async (req, res) => {
  const filters = {
    type: req.query.type || '',
    category_id: req.query.category_id ? parseInt(req.query.category_id) : '',
    startDate: req.query.start_date || '',
    endDate: req.query.end_date || ''
  };
  const result = await exportService.exportTransactionsCSV(
    req.user.id,
    filters
  );
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${result.filename}"`
  );
  return res.sendFile(result.filePath);
});

const exportJSON = asyncHandler(async (req, res) => {
  const filters = {
    type: req.query.type || '',
    category_id: req.query.category_id ? parseInt(req.query.category_id) : '',
    startDate: req.query.start_date || '',
    endDate: req.query.end_date || ''
  };
  const result = await exportService.exportTransactionsJSON(
    req.user.id,
    filters
  );
  res.setHeader('Content-Type', 'application/json');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${result.filename}"`
  );
  return res.sendFile(result.filePath);
});

const downloadReport = asyncHandler(async (req, res) => {
  const filename = req.params.filename;
  if (
    path.basename(filename) !== filename ||
    !new RegExp(`^report_${req.user.id}_[A-Za-z0-9_-]+\\.pdf$`).test(filename)
  )
    throw new (require('../utils/errors').NotFoundError)('Export not found');
  const filePath = exportService.getFileStream(req.params.filename);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${req.params.filename}"`
  );
  return res.sendFile(filePath);
});

module.exports = { exportCSV, exportJSON, downloadReport };
