const express = require('express');
const router = express.Router();
const treasurerController = require('../controllers/treasurerController');
const { authenticateToken, isTreasurer } = require('../middleware/auth');
const { getMembers } = require('../controllers/treasurerController');

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
router.patch('/dues/:dueId/date', treasurerController.updateDueDate);
router.patch('/dues/:dueId/users/:userId/payment', treasurerController.updateUserPaymentStatus);
router.patch('/dues/:dueId/users/batch-payment', treasurerController.batchUpdateUserPaymentStatus);

// Payment management
router.get('/payments/pending', treasurerController.getPendingPayments);
router.post('/payments/:paymentId/verify', treasurerController.verifyPayment);
router.post('/payments/:paymentId/reject', treasurerController.rejectPayment);
router.get('/payments/export', treasurerController.exportPayments);

// Reports
router.get('/reports/summary', treasurerController.exportSummaryReport);
router.get('/students/export', treasurerController.exportStudentList);

// Group members
router.get('/members', getMembers);

// Checklists
router.get('/checklists', treasurerController.getChecklists);
router.post('/checklists', treasurerController.createChecklist);
router.get('/checklists/:checklistId', treasurerController.getChecklistStatus);
router.get('/checklists/:checklistId/export', treasurerController.exportChecklistStatus);
router.post('/checklists/:checklistId/items', treasurerController.addChecklistItem);
router.patch('/checklists/:checklistId/items/:itemId', treasurerController.updateChecklistItem);
router.delete('/checklists/:checklistId/items/:itemId', treasurerController.deleteChecklistItem);
router.patch('/checklists/:checklistId/items/:itemId/users/:userId', treasurerController.updateChecklistItemStatus);
router.delete('/checklists/:checklistId', treasurerController.deleteChecklist);

module.exports = router; 