const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goal.controller');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { createGoalValidator, updateGoalValidator, goalIdValidator, contributionValidator } = require('../validators/goal.validator');

router.use(authenticate);
router.get('/', goalController.getGoals);
router.post('/', createGoalValidator, validate, goalController.createGoal);
router.get('/:id', goalIdValidator, validate, goalController.getGoal);
router.put('/:id', updateGoalValidator, validate, goalController.updateGoal);
router.patch('/:id', updateGoalValidator, validate, goalController.updateGoal);
router.delete('/:id', goalIdValidator, validate, goalController.deleteGoal);
router.post('/:id/contributions', contributionValidator, validate, goalController.contribute);
router.get('/:id/contributions', goalIdValidator, validate, goalController.getContributions);
router.delete('/:id/contributions/:contributionId', goalIdValidator, validate, goalController.deleteContribution);

module.exports = router;
