const express = require('express');
const router = express.Router();
const multer = require('multer');
const { submitPayment, verifyPayment } = require('../controllers/paymentController');
const { authenticateToken, isFinanceCoordinator } = require('../middleware/auth');

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

// Submit payment route
router.post('/submit',
  authenticateToken,
  upload.single('receipt'),
  submitPayment
);

// Verify payment route (Finance Coordinator only)
router.post('/:paymentId/verify',
  authenticateToken,
  isFinanceCoordinator,
  verifyPayment
);

// Reject payment route (Finance Coordinator only)
router.post('/:paymentId/reject',
  authenticateToken,
  isFinanceCoordinator,
  require('../controllers/paymentController').rejectPayment
);

module.exports = router; 