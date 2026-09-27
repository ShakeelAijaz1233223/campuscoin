const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budget.controller');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { createBudgetValidator, updateBudgetValidator, budgetIdValidator, budgetMonthValidator } = require('../validators/budget.validator');

router.use(authenticate);
router.get('/', budgetMonthValidator, validate, budgetController.getBudgets);
router.get('/alerts', budgetMonthValidator, validate, budgetController.getBudgetAlerts);
router.get('/:id', budgetIdValidator, validate, budgetController.getBudget);
router.post('/', createBudgetValidator, validate, budgetController.createBudget);
router.put('/:id', updateBudgetValidator, validate, budgetController.updateBudget);
router.patch('/:id', updateBudgetValidator, validate, budgetController.updateBudget);
router.delete('/:id', budgetIdValidator, validate, budgetController.deleteBudget);

module.exports = router;
