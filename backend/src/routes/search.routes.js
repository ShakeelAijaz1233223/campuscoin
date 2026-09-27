const express = require('express');
const router = express.Router();
const searchController = require('../controllers/search.controller');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);
router.get('/', searchController.search);

module.exports = router;
