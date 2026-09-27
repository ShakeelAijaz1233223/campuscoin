const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { updateSettingsValidator } = require('../validators/settings.validator');

router.use(authenticate);
router.get('/', settingsController.getSettings);
router.put('/', updateSettingsValidator, validate, settingsController.updateSettings);
router.patch('/', updateSettingsValidator, validate, settingsController.updateSettings);

module.exports = router;
