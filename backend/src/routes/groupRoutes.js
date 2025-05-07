const express = require('express');
const router = express.Router();
const { createGroup, getGroup, getGroupLimits, getGroupDashboard, regenerateGroupCode, updateGroupSettings, getGroupMembers, getUserContributions, getPendingPaymentsForGroup, addExpense, getExpenses, updateExpense, deleteExpense, getPendingIntraGroupLoans, getPendingInterGroupLoansIncoming } = require('../controllers/groupController');
const { authenticateToken, isFinanceCoordinator } = require('../middleware/auth');
const multer = require('multer');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Protected routes - require authentication
router.use(authenticateToken);

// Add after router.use(authenticateToken)
router.get('/', require('../controllers/groupController').getAllGroups);

// Create a new group
router.post('/', createGroup);

// Get group by ID
router.get('/:id', getGroup);

// Get group loan limits
router.get('/:groupId/limits', getGroupLimits);

// Get group dashboard data
router.get('/:groupId/dashboard', getGroupDashboard);

// Regenerate group invitation code
router.post('/:groupId/regenerate-code', regenerateGroupCode);

// Update group settings (FC only)
router.put('/:groupId/settings', updateGroupSettings);

// Get all members in a group with their status (FC only)
router.get('/:groupId/members', getGroupMembers);

// Get all payments pending verification for a group (FC only)
router.get('/:groupId/payments/pending', getPendingPaymentsForGroup);

// Get detailed contribution history for a specific user (FC only)
router.get('/users/:userId/contributions', getUserContributions);

// Expense Management Routes (FC only)
router.post('/:groupId/expenses', upload.single('receipt'), addExpense);
router.get('/:groupId/expenses', getExpenses);
router.patch('/:groupId/expenses/:expenseId', upload.single('receipt'), updateExpense);
router.delete('/:groupId/expenses/:expenseId', deleteExpense);

// Loan routes for groups
router.get('/:groupId/loans/pending/intra', authenticateToken, isFinanceCoordinator, getPendingIntraGroupLoans);
router.get('/:groupId/loans/pending/inter/incoming', authenticateToken, isFinanceCoordinator, getPendingInterGroupLoansIncoming);

module.exports = router; 