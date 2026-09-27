const express = require('express');
const router = express.Router();
const recurringController = require('../controllers/recurring.controller');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const {
  createRecurringValidator, updateRecurringValidator,
  recurringIdValidator, listRecurringValidator
} = require('../validators/recurring.validator');

router.use(authenticate);
router.get('/', listRecurringValidator, validate, recurringController.getRecurring);
router.post('/', createRecurringValidator, validate, recurringController.createRecurring);
router.post('/process', recurringController.processNow);
router.get('/:id', recurringIdValidator, validate, recurringController.getRecurringById);
router.put('/:id', updateRecurringValidator, validate, recurringController.updateRecurring);
router.patch('/:id', updateRecurringValidator, validate, recurringController.updateRecurring);
router.patch('/:id/toggle', recurringIdValidator, validate, recurringController.toggleRecurring);
router.delete('/:id', recurringIdValidator, validate, recurringController.deleteRecurring);

module.exports = router;
