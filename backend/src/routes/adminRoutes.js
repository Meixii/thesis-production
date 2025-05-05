const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Thesis weeks routes
router.get('/thesis-weeks', adminController.getThesisWeeks);
router.post('/thesis-weeks', adminController.upsertThesisWeek);
router.put('/thesis-weeks/:weekId', adminController.upsertThesisWeek);
router.delete('/thesis-weeks/:weekId', adminController.deleteThesisWeek);

// User management routes
router.get('/users', adminController.getUsers);
router.put('/users/:userId/role', adminController.updateUserRole);

// Group management routes
router.get('/groups', adminController.getGroups);
router.post('/groups', adminController.createGroup);
router.put('/groups/:id', adminController.updateGroup);
router.delete('/groups/:id', adminController.deleteGroup);

module.exports = router; 