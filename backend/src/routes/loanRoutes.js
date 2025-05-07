const express = require('express');
const router = express.Router();
const { authenticateToken, isFinanceCoordinator } = require('../middleware/auth');
const {
  requestIntraLoan,
  getLoanById,
  getUserLoans,
  approveLoan,
  rejectLoan,
  getApprovedLoans
} = require('../controllers/loanController');

// Student routes - requesting and viewing loans
router.post('/request/intra', authenticateToken, requestIntraLoan);
router.get('/my-loans', authenticateToken, getUserLoans);
router.get('/:loanId', authenticateToken, getLoanById);

// Finance Coordinator routes for loan management
router.post('/:loanId/approve', authenticateToken, isFinanceCoordinator, approveLoan);
router.post('/:loanId/reject', authenticateToken, isFinanceCoordinator, rejectLoan);
router.get('/approved', authenticateToken, isFinanceCoordinator, getApprovedLoans);

module.exports = router; 