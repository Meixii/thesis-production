const express = require('express');
const router = express.Router();
const { authenticateToken, isFinanceCoordinator } = require('../middleware/auth');
const {
  requestIntraLoan,
  getLoanById,
  getUserLoans,
  approveLoan,
  rejectLoan,
  getApprovedLoans,
  markLoanAsDisbursed,
  recordLoanRepayment,
  requestInterGroupLoan
} = require('../controllers/loanController');
const multer = require('multer');

// Student routes - requesting and viewing loans
router.post('/request/intra', authenticateToken, requestIntraLoan);
router.post('/request/inter', authenticateToken, isFinanceCoordinator, requestInterGroupLoan);
router.get('/my-loans', authenticateToken, getUserLoans);
router.get('/:loanId', authenticateToken, getLoanById);

// Finance Coordinator routes for loan management
router.post('/:loanId/approve', authenticateToken, isFinanceCoordinator, approveLoan);
router.post('/:loanId/reject', authenticateToken, isFinanceCoordinator, rejectLoan);
router.post('/:loanId/disburse', authenticateToken, isFinanceCoordinator, multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
}).single('disbursement_proof'), markLoanAsDisbursed);
router.post('/:loanId/record-repayment', authenticateToken, isFinanceCoordinator, multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
}).single('repayment_proof'), recordLoanRepayment);
router.get('/approved', authenticateToken, isFinanceCoordinator, getApprovedLoans);

module.exports = router; 