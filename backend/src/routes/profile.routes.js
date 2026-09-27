const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { updateProfileValidator, updatePreferencesValidator } = require('../validators/profile.validator');

router.use(authenticate);
router.get('/', profileController.getProfile);
router.put('/', updateProfileValidator, validate, profileController.updateProfile);
router.patch('/', updateProfileValidator, validate, profileController.updateProfile);
router.get('/preferences', profileController.getPreferences);
router.put('/preferences', updatePreferencesValidator, validate, profileController.updatePreferences);

module.exports = router;
