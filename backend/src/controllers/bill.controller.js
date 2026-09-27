const asyncHandler = require('../utils/asyncHandler');
const billService = require('../services/bill.service');
const { sendSuccess, sendCreated, sendPaginated } = require('../utils/response');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');

const getBills = asyncHandler(async (req, res) => {
  const pagination = getPagination(req.query);
  const result = await billService.getBills(req.user.id, {
    status: req.query.status || '',
    is_paid: req.query.is_paid !== undefined ? req.query.is_paid : '',
    ...pagination
  });
  const meta = buildPaginationMeta(result.total, pagination.page, pagination.limit);
  return sendPaginated(res, { bills: result.bills, summary: result.summary }, meta, 'Bills retrieved');
});

const getBill = asyncHandler(async (req, res) => {
  const bill = await billService.getBill(req.user.id, parseInt(req.params.id));
  return sendSuccess(res, { bill }, 'Bill retrieved');
});

const createBill = asyncHandler(async (req, res) => {
  const bill = await billService.createBill(req.user.id, req.body, req.ip);
  return sendCreated(res, { bill }, 'Bill created successfully');
});

const updateBill = asyncHandler(async (req, res) => {
  const bill = await billService.updateBill(req.user.id, parseInt(req.params.id), req.body, req.ip);
  return sendSuccess(res, { bill }, 'Bill updated successfully');
});

const deleteBill = asyncHandler(async (req, res) => {
  await billService.deleteBill(req.user.id, parseInt(req.params.id), req.ip);
  return sendSuccess(res, null, 'Bill deleted successfully');
});

const payBill = asyncHandler(async (req, res) => {
  const bill = await billService.payBill(req.user.id, parseInt(req.params.id), req.ip);
  return sendSuccess(res, { bill }, 'Bill marked as paid');
});

const unpayBill = asyncHandler(async (req, res) => {
  const bill = await billService.unpayBill(req.user.id, parseInt(req.params.id));
  return sendSuccess(res, { bill }, 'Bill marked as unpaid');
});

const getUpcoming = asyncHandler(async (req, res) => {
  const bills = await billService.getUpcomingBills(req.user.id, parseInt(req.query.days) || 7);
  return sendSuccess(res, { bills }, 'Upcoming bills retrieved');
});

const getOverdue = asyncHandler(async (req, res) => {
  const bills = await billService.getOverdueBills(req.user.id);
  return sendSuccess(res, { bills }, 'Overdue bills retrieved');
});

module.exports = { getBills, getBill, createBill, updateBill, deleteBill, payBill, unpayBill, getUpcoming, getOverdue };
