const express = require('express');
const router = express.Router();
const multer = require('multer');
const { body, param } = require('express-validator');
const { validateRequest } = require('../../middleware/validate');
const { authenticateToken, isStudent } = require('../../middleware/auth');
const expenseService = require('../../services/expenseService');
const { uploadToCloudinary } = require('../../utils/cloudinary');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, and PDF files are allowed.'));
    }
  }
});

// Get all expense requests for the student
router.get('/', authenticateToken, isStudent, async (req, res) => {
  try {
    const expenses = await expenseService.getStudentExpenses(req.user.userId);
    res.json({ success: true, data: expenses });
  } catch (error) {
    console.error('Error getting student expenses:', error);
    res.status(500).json({ success: false, error: 'Failed to get expenses' });
  }
});

// Get expense categories
router.get('/categories', authenticateToken, isStudent, async (req, res) => {
  try {
    const categories = await expenseService.getExpenseCategories();
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Error getting expense categories:', error);
    res.status(500).json({ success: false, error: 'Failed to get categories' });
  }
});

// Create a new expense request
router.post('/', [
  authenticateToken,
  isStudent,
  body('categoryId').isInt().withMessage('Category ID must be an integer'),
  body('title').trim().notEmpty().withMessage('Title is required')
    .isLength({ max: 200 }).withMessage('Title must be at most 200 characters'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  validateRequest
], async (req, res) => {
  try {
    const expenseRequest = await expenseService.createExpenseRequest({
      userId: req.user.userId,
      categoryId: req.body.categoryId,
      title: req.body.title,
      description: req.body.description,
      amount: req.body.amount
    });
    res.json({ success: true, data: expenseRequest });
  } catch (error) {
    console.error('Error creating expense request:', error);
    res.status(500).json({ success: false, error: 'Failed to create expense request' });
  }
});

// Get expense request details
router.get('/:id', [
  authenticateToken,
  isStudent,
  param('id').isInt().withMessage('Expense ID must be an integer'),
  validateRequest
], async (req, res) => {
  try {
    const expenseRequest = await expenseService.getExpenseRequestDetails(
      parseInt(req.params.id),
      req.user.userId
    );
    res.json({ success: true, data: expenseRequest });
  } catch (error) {
    console.error('Error getting expense request details:', error);
    if (error.message === 'Expense request not found') {
      res.status(404).json({ success: false, error: 'Expense request not found' });
    } else {
      res.status(500).json({ success: false, error: 'Failed to get expense request details' });
    }
  }
});

// Upload proof for an expense request
router.post('/:id/proof', [
  authenticateToken,
  isStudent,
  upload.single('proofFile'),
  param('id').isInt().withMessage('Expense ID must be an integer'),
  body('proofType').isIn(['receipt', 'photo', 'document']).withMessage('Invalid proof type'),
  validateRequest
], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded.' });
    }

    // Get expense details for filename generation
    const expenseDetails = await expenseService.getExpenseRequestDetails(
      parseInt(req.params.id),
      req.user.userId
    );

    // Upload file to Cloudinary
    const uploadResult = await uploadToCloudinary(req.file, {
      expenseReceipt: true,
      category: expenseDetails.category.name,
      amount: expenseDetails.amount,
      quantity: 1,
      unit: 'item'
    });

    // Create proof record in database
    const proof = await expenseService.uploadExpenseProof({
      expenseId: parseInt(req.params.id),
      userId: req.user.userId,
      proofType: req.body.proofType,
      fileUrl: uploadResult.secure_url
    });

    res.json({ 
      success: true, 
      data: {
        ...proof,
        cloudinaryUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id
      }
    });
  } catch (error) {
    console.error('Error uploading expense proof:', error);
    if (error.message === 'Expense request not found') {
      res.status(404).json({ success: false, error: 'Expense request not found' });
    } else if (error.message === 'No file uploaded.') {
      res.status(400).json({ success: false, error: 'No file uploaded.' });
    } else {
      res.status(500).json({ success: false, error: 'Failed to upload proof' });
    }
  }
});

module.exports = router;