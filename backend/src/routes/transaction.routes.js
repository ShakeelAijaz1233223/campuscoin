const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transaction.controller');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const {
  createTransactionValidator, updateTransactionValidator,
  transactionIdValidator, listTransactionsValidator
} = require('../validators/transaction.validator');

router.use(authenticate);
router.get('/', listTransactionsValidator, validate, transactionController.getTransactions);
router.get('/recently-viewed', transactionController.getRecentlyViewed);
router.get('/recently-edited', transactionController.getRecentlyEdited);
router.get('/unusually-large', transactionController.getUnusuallyLarge);
router.get('/:id', transactionIdValidator, validate, transactionController.getTransaction);
router.post('/', createTransactionValidator, validate, transactionController.createTransaction);
router.put('/:id', updateTransactionValidator, validate, transactionController.updateTransaction);
router.patch('/:id', updateTransactionValidator, validate, transactionController.updateTransaction);
router.delete('/:id', transactionIdValidator, validate, transactionController.deleteTransaction);

module.exports = router;
