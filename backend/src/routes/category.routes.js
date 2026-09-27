const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { createCategoryValidator, updateCategoryValidator, categoryIdValidator, listCategoriesValidator } = require('../validators/category.validator');

router.use(authenticate);
router.get('/', listCategoriesValidator, validate, categoryController.getCategories);
router.get('/defaults', categoryController.getDefaultCategories);
router.get('/:id', categoryIdValidator, validate, categoryController.getCategory);
router.post('/', createCategoryValidator, validate, categoryController.createCategory);
router.put('/:id', updateCategoryValidator, validate, categoryController.updateCategory);
router.patch('/:id', updateCategoryValidator, validate, categoryController.updateCategory);
router.delete('/:id', categoryIdValidator, validate, categoryController.deleteCategory);

module.exports = router;
