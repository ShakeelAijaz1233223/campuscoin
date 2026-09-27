const express = require('express');
const router = express.Router();
const accountController = require('../controllers/account.controller');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { createAccountValidator, updateAccountValidator, accountIdValidator } = require('../validators/account.validator');

router.use(authenticate);
router.get('/', accountController.getAccounts);
router.get('/:id', accountIdValidator, validate, accountController.getAccount);
router.post('/', createAccountValidator, validate, accountController.createAccount);
router.put('/:id', updateAccountValidator, validate, accountController.updateAccount);
router.patch('/:id', updateAccountValidator, validate, accountController.updateAccount);
router.delete('/:id', accountIdValidator, validate, accountController.deleteAccount);

module.exports = router;
