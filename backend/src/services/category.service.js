const CategoryModel = require('../models/category.model');
const ActivityModel = require('../models/activity.model');
const db = require('../config/database');
const { NotFoundError, ConflictError, ForbiddenError } = require('../utils/errors');

const getCategories = async (userId, { type = '' } = {}) => {
  return CategoryModel.findByUser(userId, { type });
};

const getCategory = async (userId, categoryId) => {
  const category = await CategoryModel.findById(categoryId);
  if (!category || (category.user_id !== userId && category.is_default !== 1)) {
    throw new NotFoundError('Category not found');
  }
  return category;
};

const createCategory = async (userId, data) => {
  const duplicate = await db.getOne(
    'SELECT id FROM categories WHERE LOWER(name) = LOWER(?) AND type = ? AND (user_id = ? OR user_id IS NULL) AND status = ?',
    [data.name.trim(), data.type, userId, 'active']
  );
  if (duplicate) throw new ConflictError(`A ${data.type} category named "${data.name}" already exists`);

  const category = await CategoryModel.create(userId, { ...data, name: data.name.trim() });
  await ActivityModel.create(userId, 'created', 'category', category.id, `Created category: ${data.name}`);
  return CategoryModel.findById(category.id);
};

const updateCategory = async (userId, categoryId, data) => {
  const category = await CategoryModel.findById(categoryId);
  if (!category || (category.user_id !== userId && category.is_default !== 1)) {
    throw new NotFoundError('Category not found');
  }
  if (category.is_default === 1 && category.user_id === null) {
    throw new ForbiddenError('Default system categories cannot be modified. Create a custom category instead.');
  }

  if (data.name) {
    const duplicate = await db.getOne(
      'SELECT id FROM categories WHERE LOWER(name) = LOWER(?) AND type = ? AND (user_id = ? OR user_id IS NULL) AND status = ? AND id != ?',
      [data.name.trim(), category.type, userId, 'active', categoryId]
    );
    if (duplicate) throw new ConflictError(`A category named "${data.name}" already exists`);
    data.name = data.name.trim();
  }

  await CategoryModel.update(categoryId, data);
  await ActivityModel.create(userId, 'updated', 'category', categoryId, `Updated category: ${data.name || category.name}`);
  return CategoryModel.findById(categoryId);
};

const deleteCategory = async (userId, categoryId) => {
  const category = await CategoryModel.findById(categoryId);
  if (!category) throw new NotFoundError('Category not found');

  if (category.is_default === 1 && category.user_id === null) {
    throw new ForbiddenError('Default system categories cannot be deleted.');
  }
  if (category.user_id !== userId) throw new NotFoundError('Category not found');

  // Never corrupt history: a category with transactions is archived, not hard-deleted.
  const hasTransactions = await CategoryModel.hasTransactions(categoryId);
  await CategoryModel.delete(categoryId);
  await db.update("UPDATE budgets SET status = 'archived' WHERE category_id = ?", [categoryId]);

  await ActivityModel.create(userId, 'deleted', 'category', categoryId, `Deleted category: ${category.name}${hasTransactions ? ' (archived to preserve history)' : ''}`);
  return { archived_due_to_history: hasTransactions };
};

const getDefaultCategories = async (type = '') => {
  return CategoryModel.findDefault(type || null);
};

module.exports = { getCategories, getCategory, createCategory, updateCategory, deleteCategory, getDefaultCategories };
