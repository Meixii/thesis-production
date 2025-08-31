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
router.post('/users', adminController.createUser);
router.put('/users/:userId/role', adminController.updateUserRole);
router.delete('/users/:userId', adminController.deleteUser);

// Reset user password route
router.put('/users/:userId/reset-password', authenticateToken, adminController.resetUserPassword);

// Group management routes
router.get('/groups', adminController.getGroups);
router.post('/groups', adminController.createGroup);
router.put('/groups/:id', adminController.updateGroup);
router.delete('/groups/:id', adminController.deleteGroup);

// Database export route
router.get('/export-db', adminController.exportDatabase);

module.exports = router; 