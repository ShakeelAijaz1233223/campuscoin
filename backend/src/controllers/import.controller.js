const asyncHandler = require('../utils/asyncHandler');
const importService = require('../services/import.service');
const { sendSuccess, sendCreated, sendPaginated } = require('../utils/response');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');

const uploadImport = asyncHandler(async (req, res) => {
  const result = await importService.createImport(req.user.id, req.file, {
    account_id: req.body.account_id ? parseInt(req.body.account_id) : null,
    type_default: req.body.type_default || 'expense',
    use_ai: req.body.use_ai !== 'false' && req.body.use_ai !== false
  });
  return sendCreated(res, result, 'CSV parsed and preview ready');
});

const getImports = asyncHandler(async (req, res) => {
  const pagination = getPagination(req.query);
  const result = await importService.getImports(req.user.id, pagination);
  const meta = buildPaginationMeta(result.total, pagination.page, pagination.limit);
  return sendPaginated(res, { imports: result.imports }, meta, 'Import history retrieved');
});

const getImport = asyncHandler(async (req, res) => {
  const result = await importService.getImport(req.user.id, parseInt(req.params.id));
  return sendSuccess(res, result, 'Import retrieved');
});

const getImportErrors = asyncHandler(async (req, res) => {
  const errors = await importService.getImportErrors(req.user.id, parseInt(req.params.id));
  return sendSuccess(res, { errors }, 'Import row errors retrieved');
});

const correctRow = asyncHandler(async (req, res) => {
  const rows = await importService.correctImportRow(req.user.id, parseInt(req.params.id), parseInt(req.params.rowId), req.body);
  return sendSuccess(res, { rows }, 'Row corrected');
});

const confirmImport = asyncHandler(async (req, res) => {
  const result = await importService.confirmImport(req.user.id, parseInt(req.params.id), {
    include_duplicates: req.body.include_duplicates === true,
    skip_duplicates: req.body.skip_duplicates !== false
  }, req.ip);
  return sendSuccess(res, result, 'Import confirmed and processed');
});

const cancelImport = asyncHandler(async (req, res) => {
  await importService.cancelImport(req.user.id, parseInt(req.params.id));
  return sendSuccess(res, null, 'Import cancelled');
});

module.exports = { uploadImport, getImports, getImport, getImportErrors, correctRow, confirmImport, cancelImport };
