const asyncHandler = require('../utils/asyncHandler');
const exportService = require('../services/export.service');
const fs = require('fs');

const exportCSV = asyncHandler(async (req, res) => {
  const filters = {
    type: req.query.type || '',
    category_id: req.query.category_id ? parseInt(req.query.category_id) : '',
    startDate: req.query.start_date || '',
    endDate: req.query.end_date || ''
  };
  const result = await exportService.exportTransactionsCSV(req.user.id, filters);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
  fs.createReadStream(result.filePath).pipe(res);
});

const exportJSON = asyncHandler(async (req, res) => {
  const filters = {
    type: req.query.type || '',
    category_id: req.query.category_id ? parseInt(req.query.category_id) : '',
    startDate: req.query.start_date || '',
    endDate: req.query.end_date || ''
  };
  const result = await exportService.exportTransactionsJSON(req.user.id, filters);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
  fs.createReadStream(result.filePath).pipe(res);
});

const downloadReport = asyncHandler(async (req, res) => {
  const filePath = exportService.getFileStream(req.params.filename);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${req.params.filename}"`);
  fs.createReadStream(filePath).pipe(res);
});

module.exports = { exportCSV, exportJSON, downloadReport };
