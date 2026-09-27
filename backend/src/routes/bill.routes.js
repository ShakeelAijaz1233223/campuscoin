const express = require('express');
const router = express.Router();
const billController = require('../controllers/bill.controller');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { createBillValidator, updateBillValidator, billIdValidator } = require('../validators/bill.validator');

router.use(authenticate);
router.get('/', billController.getBills);
router.get('/upcoming', billController.getUpcoming);
router.get('/overdue', billController.getOverdue);
router.get('/:id', billIdValidator, validate, billController.getBill);
router.post('/', createBillValidator, validate, billController.createBill);
router.put('/:id', updateBillValidator, validate, billController.updateBill);
router.patch('/:id', updateBillValidator, validate, billController.updateBill);
router.patch('/:id/pay', billIdValidator, validate, billController.payBill);
router.patch('/:id/unpay', billIdValidator, validate, billController.unpayBill);
router.delete('/:id', billIdValidator, validate, billController.deleteBill);

module.exports = router;
