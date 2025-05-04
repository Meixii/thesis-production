const express = require('express');
const router = express.Router();
const { authenticateToken, isFinanceCoordinator } = require('../middleware/auth');
const {
  requestIntraLoan,
  getLoanById,
  getUserLoans
} = require('../controllers/loanController');

// Student routes - requesting and viewing loans
router.post('/request/intra', authenticateToken, requestIntraLoan);
router.get('/my-loans', authenticateToken, getUserLoans);
router.get('/:loanId', authenticateToken, getLoanById);

// Finance Coordinator routes will be added later
// These will include approving/rejecting loans, marking loans as disbursed, etc.

module.exports = router; 