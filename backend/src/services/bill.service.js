const BillModel = require('../models/bill.model');
const CategoryModel = require('../models/category.model');
const ActivityModel = require('../models/activity.model');
const NotificationModel = require('../models/notification.model');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const { round2 } = require('../helpers/statistics');

const enrichBill = (bill) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(bill.due_date);
  const days_until_due = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
  const isOverdue = !bill.is_paid && days_until_due < 0 && bill.status === 'active';
  return {
    ...bill,
    days_until_due,
    overdue: isOverdue,
    upcoming: !bill.is_paid && days_until_due >= 0 && days_until_due <= (bill.reminder_days || 3)
  };
};

const getBills = async (userId, filters) => {
  const { bills, total } = await BillModel.findByUser(userId, filters);
  const enriched = bills.map(enrichBill);
  const unpaid = enriched.filter((b) => !b.is_paid && b.status === 'active');
  return {
    bills: enriched,
    total,
    summary: {
      unpaid_count: unpaid.length,
      unpaid_total: round2(unpaid.reduce((s, b) => s + parseFloat(b.amount), 0)),
      overdue_count: unpaid.filter((b) => b.overdue).length
    }
  };
};

const getBill = async (userId, id) => {
  const bill = await BillModel.findById(id);
  if (!bill || bill.user_id !== userId) throw new NotFoundError('Bill not found');
  return enrichBill(bill);
};

const createBill = async (userId, data, ip = null) => {
  if (data.category_id) {
    const category = await CategoryModel.findById(data.category_id);
    if (!category || (category.user_id !== userId && category.is_default !== 1)) throw new BadRequestError('Invalid category');
  }
  if (data.amount <= 0) throw new BadRequestError('Bill amount must be positive');

  data.user_id = userId;
  const result = await BillModel.create(data);
  await ActivityModel.create(userId, 'created', 'bill', result.id, `Created bill: ${data.name}`, null, ip);
  return enrichBill(await BillModel.findById(result.id));
};

const updateBill = async (userId, id, data, ip = null) => {
  const bill = await BillModel.findById(id);
  if (!bill || bill.user_id !== userId) throw new NotFoundError('Bill not found');

  if (data.category_id) {
    const category = await CategoryModel.findById(data.category_id);
    if (!category || (category.user_id !== userId && category.is_default !== 1)) throw new BadRequestError('Invalid category');
  }

  if(data.is_paid !== undefined)data.paid_date=data.is_paid?new Date().toISOString().slice(0,10):null;
  await BillModel.update(id, data);
  await ActivityModel.create(userId, 'updated', 'bill', id, `Updated bill: ${bill.name}`, null, ip);
  return enrichBill(await BillModel.findById(id));
};

const deleteBill = async (userId, id, ip = null) => {
  const bill = await BillModel.findById(id);
  if (!bill || bill.user_id !== userId) throw new NotFoundError('Bill not found');
  await BillModel.delete(id);
  await ActivityModel.create(userId, 'deleted', 'bill', id, `Deleted bill: ${bill.name}`, null, ip);
  return true;
};

const payBill = async (userId, id, ip = null) => {
  const bill = await BillModel.findById(id);
  if (!bill || bill.user_id !== userId) throw new NotFoundError('Bill not found');
  if (bill.is_paid) throw new BadRequestError('Bill is already paid');
  await BillModel.markPaid(id);
  await ActivityModel.create(userId, 'paid', 'bill', id, `Marked bill paid: ${bill.name}`, null, ip);
  return enrichBill(await BillModel.findById(id));
};

const unpayBill = async (userId, id) => {
  const bill = await BillModel.findById(id);
  if (!bill || bill.user_id !== userId) throw new NotFoundError('Bill not found');
  await BillModel.markUnpaid(id);
  return enrichBill(await BillModel.findById(id));
};

const getUpcomingBills = async (userId, days = 7) => {
  return (await BillModel.getUpcoming(userId, days)).map(enrichBill);
};

const getOverdueBills = async (userId) => {
  return (await BillModel.getOverdue(userId)).map(enrichBill);
};

/**
 * Scan all users' bills and generate reminders/overdue notifications.
 * Invoked from the cron runner and on-demand by admins.
 */
const processBillReminders = async () => {
  const users = await db.query("SELECT DISTINCT user_id FROM bills WHERE is_paid = 0 AND status = 'active'");
  let reminders = 0;
  let overdue = 0;
  for (const { user_id } of users) {
    const due = await BillModel.getDueForReminder(user_id);
    for (const bill of due) {
      const existing = await db.getOne(
        "SELECT id FROM notifications WHERE user_id = ? AND type = 'bill_reminder' AND DATE(created_at) = CURDATE() AND JSON_EXTRACT(data, '$.bill_id') = ?",
        [user_id, bill.id]
      );
      if (!existing) {
        await NotificationModel.create(user_id, 'bill_reminder', 'Bill Due Soon',
          `${bill.name} of ${bill.amount} is due on ${bill.due_date}.`, { bill_id: bill.id });
        reminders++;
      }
    }
    const overdueBills = await BillModel.getOverdue(user_id);
    for (const bill of overdueBills) {
      const existing = await db.getOne(
        "SELECT id FROM notifications WHERE user_id = ? AND type = 'bill_overdue' AND DATE(created_at) = CURDATE() AND JSON_EXTRACT(data, '$.bill_id') = ?",
        [user_id, bill.id]
      );
      if (!existing) {
        await NotificationModel.create(user_id, 'bill_overdue', 'Bill Overdue',
          `${bill.name} of ${bill.amount} was due on ${bill.due_date} and is unpaid.`, { bill_id: bill.id });
        overdue++;
      }
    }
  }
  return { reminders, overdue };
};

const db = require('../config/database');

module.exports = { getBills, getBill, createBill, updateBill, deleteBill, payBill, unpayBill, getUpcomingBills, getOverdueBills, processBillReminders, enrichBill };
