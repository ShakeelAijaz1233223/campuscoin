const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { param } = require('express-validator');

const idValidator = [param('id').isInt({ min: 1 }).withMessage('Invalid notification id')];

router.use(authenticate);
router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.patch('/read-all', notificationController.markAllRead);
router.patch('/:id/read', idValidator, validate, notificationController.markRead);
router.delete('/:id', idValidator, validate, notificationController.deleteNotification);

module.exports = router;
