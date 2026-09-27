const asyncHandler = require('../utils/asyncHandler');
const categoryService = require('../services/category.service');
const { sendSuccess, sendCreated } = require('../utils/response');

const getCategories = asyncHandler(async (req, res) => {
  const categories = await categoryService.getCategories(req.user.id, { type: req.query.type || '' });
  return sendSuccess(res, { categories }, 'Categories retrieved');
});

const getCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.getCategory(req.user.id, parseInt(req.params.id));
  return sendSuccess(res, { category }, 'Category retrieved');
});

const createCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(req.user.id, req.body);
  return sendCreated(res, { category }, 'Category created successfully');
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.updateCategory(req.user.id, parseInt(req.params.id), req.body);
  return sendSuccess(res, { category }, 'Category updated successfully');
});

const deleteCategory = asyncHandler(async (req, res) => {
  const result = await categoryService.deleteCategory(req.user.id, parseInt(req.params.id));
  return sendSuccess(res, result, 'Category deleted successfully');
});

const getDefaultCategories = asyncHandler(async (req, res) => {
  const categories = await categoryService.getDefaultCategories(req.query.type || '');
  return sendSuccess(res, { categories }, 'Default categories retrieved');
});

module.exports = { getCategories, getCategory, createCategory, updateCategory, deleteCategory, getDefaultCategories };
