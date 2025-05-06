const express = require('express');
const router = express.Router();
const treasurerController = require('../controllers/treasurerController');
const { authenticateToken, isTreasurer } = require('../middleware/auth');

// All routes require authentication and treasurer role
router.use(authenticateToken);
router.use(isTreasurer);

// Profile routes
router.get('/profile', treasurerController.getProfile);
router.put('/profile', treasurerController.updateProfile);
router.get('/group', treasurerController.getGroupDetails);

// Dashboard data
router.get('/dashboard', treasurerController.getDashboardData);
router.get('/stats', treasurerController.getStats);

// Dues management
router.get('/dues', treasurerController.getDues);
router.post('/dues', treasurerController.createDue);
router.get('/dues/:dueId/status', treasurerController.getDueStatus);
router.get('/dues/:dueId/export', treasurerController.exportDueStatus);
router.delete('/dues/:dueId', treasurerController.deleteDue);

// Payment management
router.get('/payments/pending', treasurerController.getPendingPayments);
router.post('/payments/:paymentId/verify', treasurerController.verifyPayment);
router.post('/payments/:paymentId/reject', treasurerController.rejectPayment);
router.get('/payments/export', treasurerController.exportPayments);

// Reports
router.get('/reports/summary', treasurerController.exportSummaryReport);
router.get('/students/export', treasurerController.exportStudentList);

module.exports = router; 