const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { joinGroup, getDashboardData, getMyDues, getMyDueDetails, payDue, getMyPaymentHistory, getPayableWeeks, getPayableExpenses } = require('../controllers/studentController');
const multer = require('multer');

// Configure multer for memory storage (5MB limit, images only)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Protected routes - require authentication
router.use(authenticateToken);

// Join a thesis group
router.post('/join-group', joinGroup);

// Get student dashboard data
router.get('/dashboard', getDashboardData);

// List all dues assigned to the student
router.get('/dues', getMyDues);

// Get details and payment history for a specific due
router.get('/dues/:dueId', getMyDueDetails);

// Submit a payment for a due
router.post('/dues/:dueId/pay', upload.single('receipt'), payDue);

// Get payment history for the authenticated student
router.get('/payments/my-history', getMyPaymentHistory);

// New route to get payable weeks for the student
router.get('/payable-weeks', getPayableWeeks);

// New route to get payable distributed expenses for the student
router.get('/payable-expenses', getPayableExpenses);

module.exports = router; 