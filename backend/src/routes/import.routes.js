const express = require('express');
const router = express.Router();
const importController = require('../controllers/import.controller');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { uploadLimiter } = require('../middleware/rateLimit');
const { handleUpload } = require('../middleware/upload');
const { confirmImportValidator, correctRowValidator, importIdValidator, listImportsValidator } = require('../validators/import.validator');

router.use(authenticate);
router.post('/upload', uploadLimiter, handleUpload, importController.uploadImport);
router.get('/', listImportsValidator, validate, importController.getImports);
router.get('/:id', importIdValidator, validate, importController.getImport);
router.get('/:id/errors', importIdValidator, validate, importController.getImportErrors);
router.patch('/:id/rows/:rowId', correctRowValidator, validate, importController.correctRow);
router.post('/:id/confirm', confirmImportValidator, validate, importController.confirmImport);
router.post('/:id/cancel', importIdValidator, validate, importController.cancelImport);

module.exports = router;
