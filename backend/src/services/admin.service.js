const UserModel = require('../models/user.model');
const CategoryModel = require('../models/category.model');
const TipModel = require('../models/tip.model');
const AnnouncementModel = require('../models/announcement.model');
const ActivityModel = require('../models/activity.model');
const TransactionModel = require('../models/transaction.model');
const ProfileModel = require('../models/profile.model');
const db = require('../config/database');
const {
  NotFoundError,
  BadRequestError,
  ForbiddenError
} = require('../utils/errors');
const { round2 } = require('../helpers/statistics');

// ---------- Admin dashboard & statistics ----------

const getAdminDashboard = async () => {
  const [
    userCount,
    activeCount,
    studentCount,
    adminCount,
    txCount,
    categoryCount
  ] = await Promise.all([
    UserModel.count(),
    UserModel.countByStatus('active'),
    UserModel.countByRole('student'),
    UserModel.countByRole('admin'),
    TransactionModel.countAll(),
    db
      .getOne('SELECT COUNT(*) as total FROM categories WHERE is_default = 1')
      .then((r) => r.total)
  ]);

  const recentUsers = await db.query(
    'SELECT u.id, u.email, u.role, u.status, u.created_at, p.first_name, p.last_name FROM users u LEFT JOIN profiles p ON u.id = p.user_id ORDER BY u.created_at DESC LIMIT 10'
  );

  const recentActivity = await db.query(
    `SELECT a.*, u.email FROM activities a INNER JOIN users u ON a.user_id = u.id ORDER BY a.created_at DESC LIMIT 15`
  );

  const signupsByDay = await db.query(
    'SELECT DATE(created_at) as date, COUNT(*) as count FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) GROUP BY DATE(created_at) ORDER BY date'
  );

  return {
    statistics: {
      total_users: userCount,
      active_users: activeCount,
      total_students: studentCount,
      total_admins: adminCount,
      total_transactions: txCount,
      default_categories: categoryCount
    },
    recent_users: recentUsers,
    recent_activity: recentActivity,
    signups_last_30_days: signupsByDay
  };
};

const getStatistics = async () => {
  const [userCount, txCount] = await Promise.all([
    UserModel.count(),
    TransactionModel.countAll()
  ]);

  const txByType = await db.query(
    "SELECT type, COUNT(*) as count, COALESCE(SUM(amount),0) as total FROM transactions WHERE status = 'active' GROUP BY type"
  );

  const topUsers = await db.query(
    `SELECT u.id, u.email, COUNT(t.id) as transaction_count, COALESCE(SUM(t.amount),0) as total_amount
     FROM users u INNER JOIN transactions t ON u.id = t.user_id AND t.status = 'active'
     GROUP BY u.id ORDER BY transaction_count DESC LIMIT 10`
  );

  const monthlySignups = await db.query(
    'SELECT YEAR(created_at) as year, MONTH(created_at) as month, COUNT(*) as count FROM users GROUP BY YEAR(created_at), MONTH(created_at) ORDER BY year DESC, month DESC LIMIT 12'
  );

  return {
    total_users: userCount,
    total_transactions: txCount,
    transactions_by_type: txByType.map((r) => ({
      type: r.type,
      count: r.count,
      total: round2(parseFloat(r.total))
    })),
    top_users_by_transactions: topUsers,
    monthly_signups: monthlySignups
  };
};

const getActiveUsers = async (days = 30) => {
  return UserModel.getActiveUsers(days);
};

const getMostUsedCategories = async (limit = 10) => {
  return CategoryModel.getMostUsedSystem(limit);
};

const getTransactionCount = async () => {
  return { total_transactions: await TransactionModel.countAll() };
};

// ---------- User management ----------

const getUsers = async (filters) => {
  const { users, total } = await UserModel.findAll(filters);
  return { users, total };
};

const getUserDetail = async (userId) => {
  const user = await UserModel.findById(userId);
  if (!user) throw new NotFoundError('User not found');
  const profile = await ProfileModel.findByUserId(userId);
  const stats = {
    transaction_count: await TransactionModel.count(userId),
    account_count: (
      await db.getOne('SELECT COUNT(*) as c FROM accounts WHERE user_id = ?', [
        userId
      ])
    ).c,
    goal_count: (
      await db.getOne(
        "SELECT COUNT(*) as c FROM goals WHERE user_id = ? AND status != 'cancelled'",
        [userId]
      )
    ).c
  };
  return { user, profile, stats };
};

const updateUserStatus = async (userId, status, adminId) => {
  const user = await UserModel.findById(userId);
  if (!user) throw new NotFoundError('User not found');
  if (user.role === 'admin' && status !== 'active') {
    throw new ForbiddenError('Admin accounts cannot be disabled');
  }
  await UserModel.setStatus(userId, status);
  await ActivityModel.create(
    adminId,
    'admin_action',
    'user',
    userId,
    `Set user ${user.email} status to ${status}`
  );
  return UserModel.findById(userId);
};

const resetUserAccess = async (userId, adminId) => {
  const user = await UserModel.findById(userId);
  if (!user) throw new NotFoundError('User not found');
  if (user.role === 'admin')
    throw new ForbiddenError('Cannot reset admin access');
  await db.update(
    'UPDATE users SET session_version = session_version + 1, failed_login_attempts = 0, locked_until = NULL, status = ? WHERE id = ?',
    ['active', userId]
  );
  await db.remove('DELETE FROM password_resets WHERE user_id = ?', [userId]);
  await ActivityModel.create(
    adminId,
    'admin_action',
    'user',
    userId,
    `Reset access for user ${user.email}`
  );
  return UserModel.findById(userId);
};

// ---------- Default categories management ----------

const getDefaultCategoriesAdmin = async () => {
  return CategoryModel.findDefault(null);
};

const createDefaultCategory = async (adminId, data) => {
  const duplicate = await db.getOne(
    "SELECT id FROM categories WHERE LOWER(name) = LOWER(?) AND type = ? AND user_id IS NULL AND status = 'active'",
    [data.name.trim(), data.type]
  );
  if (duplicate) throw new BadRequestError('Default category already exists');
  const result = await db.insert(
    'INSERT INTO categories (user_id, name, type, icon, color, is_default, sort_order) VALUES (NULL, ?, ?, ?, ?, 1, ?)',
    [
      data.name.trim(),
      data.type,
      data.icon || null,
      data.color || null,
      data.sort_order || 0
    ]
  );
  await ActivityModel.create(
    adminId,
    'admin_action',
    'category',
    result.insertId,
    `Created default category: ${data.name}`
  );
  return CategoryModel.findById(result.insertId);
};

const updateDefaultCategory = async (adminId, categoryId, data) => {
  const category = await CategoryModel.findById(categoryId);
  if (!category || category.is_default !== 1)
    throw new NotFoundError('Default category not found');
  const fields = [];
  const values = [];
  for (const key of ['name', 'icon', 'color', 'sort_order', 'status']) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(data[key]);
    }
  }
  if (fields.length === 0)
    throw new BadRequestError('No valid fields to update');
  values.push(categoryId);
  await db.update(
    `UPDATE categories SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
  await ActivityModel.create(
    adminId,
    'admin_action',
    'category',
    categoryId,
    `Updated default category: ${category.name}`
  );
  return CategoryModel.findById(categoryId);
};

const deleteDefaultCategory = async (adminId, categoryId) => {
  const category = await CategoryModel.findById(categoryId);
  if (!category || category.is_default !== 1)
    throw new NotFoundError('Default category not found');
  const hasTransactions = await CategoryModel.hasTransactions(categoryId);
  await CategoryModel.delete(categoryId);
  await ActivityModel.create(
    adminId,
    'admin_action',
    'category',
    categoryId,
    `Archived default category: ${category.name}`
  );
  return { archived_due_to_history: hasTransactions };
};

// ---------- Announcements ----------

const getAnnouncements = async (filters) => {
  return AnnouncementModel.findAll(filters);
};

const createAnnouncement = async (adminId, data, ip = null) => {
  const result = await AnnouncementModel.create({
    ...data,
    created_by: adminId
  });

  // Push notification to all active users
  if (data.notify_users !== false) {
    const users = await db.query(
      "SELECT id FROM users WHERE status = 'active'"
    );
    for (const u of users) {
      await db.insert(
        'INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)',
        [u.id, 'announcement', data.title, data.content.substring(0, 500)]
      );
    }
  }

  await ActivityModel.create(
    adminId,
    'admin_action',
    'announcement',
    result.id,
    `Created announcement: ${data.title}`,
    null,
    ip
  );
  return AnnouncementModel.findById(result.id);
};

const updateAnnouncement = async (adminId, id, data, ip = null) => {
  const announcement = await AnnouncementModel.findById(id);
  if (!announcement) throw new NotFoundError('Announcement not found');
  await AnnouncementModel.update(id, data);
  await ActivityModel.create(
    adminId,
    'admin_action',
    'announcement',
    id,
    `Updated announcement: ${announcement.title}`,
    null,
    ip
  );
  return AnnouncementModel.findById(id);
};

const deleteAnnouncement = async (adminId, id, ip = null) => {
  const announcement = await AnnouncementModel.findById(id);
  if (!announcement) throw new NotFoundError('Announcement not found');
  await AnnouncementModel.delete(id);
  await ActivityModel.create(
    adminId,
    'admin_action',
    'announcement',
    id,
    `Deleted announcement: ${announcement.title}`,
    null,
    ip
  );
  return true;
};

// ---------- System tips management ----------

const getSystemTips = async (filters) => {
  return TipModel.findAll({ ...filters, includeInactive: true });
};

const createSystemTip = async (adminId, data, ip = null) => {
  const result = await TipModel.create({ ...data, is_system: true });
  await ActivityModel.create(
    adminId,
    'admin_action',
    'tip',
    result.id,
    `Created system tip: ${data.title}`,
    null,
    ip
  );
  return TipModel.findById(result.id);
};

const updateSystemTip = async (adminId, id, data, ip = null) => {
  const tip = await TipModel.findById(id);
  if (!tip) throw new NotFoundError('Tip not found');
  await TipModel.update(id, data);
  await ActivityModel.create(
    adminId,
    'admin_action',
    'tip',
    id,
    `Updated system tip: ${tip.title}`,
    null,
    ip
  );
  return TipModel.findById(id);
};

const deleteSystemTip = async (adminId, id, ip = null) => {
  const tip = await TipModel.findById(id);
  if (!tip) throw new NotFoundError('Tip not found');
  await TipModel.delete(id);
  await ActivityModel.create(
    adminId,
    'admin_action',
    'tip',
    id,
    `Deleted system tip: ${tip.title}`,
    null,
    ip
  );
  return true;
};

module.exports = {
  getAdminDashboard,
  getStatistics,
  getActiveUsers,
  getMostUsedCategories,
  getTransactionCount,
  getUsers,
  getUserDetail,
  updateUserStatus,
  resetUserAccess,
  getDefaultCategoriesAdmin,
  createDefaultCategory,
  updateDefaultCategory,
  deleteDefaultCategory,
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getSystemTips,
  createSystemTip,
  updateSystemTip,
  deleteSystemTip
};
