const express = require('express');
const router = express.Router();
const { param } = require('express-validator');
const { validateRequest } = require('../../middleware/validate');
const { authenticateToken, isTreasurer } = require('../../middleware/auth');
const expenseService = require('../../services/expenseService');

// Get all expense requests for treasurer review
router.get('/', authenticateToken, isTreasurer, async (req, res) => {
  try {
    const expenses = await expenseService.getAllExpenses();
    res.json({ success: true, expenses });
  } catch (error) {
    console.error('Error getting all expenses:', error);
    res.status(500).json({ success: false, error: 'Failed to get expenses' });
  }
});

// Get expense statistics for treasurer dashboard
router.get('/stats', authenticateToken, isTreasurer, async (req, res) => {
  try {
    const stats = await expenseService.getExpenseStats();
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error getting expense stats:', error);
    res.status(500).json({ success: false, error: 'Failed to get expense stats' });
  }
});

// Get specific expense request details
router.get('/:id', [
  authenticateToken,
  isTreasurer,
  param('id').isInt().withMessage('Expense ID must be an integer'),
  validateRequest
], async (req, res) => {
  try {
    const expense = await expenseService.getExpenseRequestDetails(
      parseInt(req.params.id)
    );
    res.json({ success: true, expense });
  } catch (error) {
    console.error('Error getting expense details:', error);
    if (error.message === 'Expense request not found') {
      res.status(404).json({ success: false, error: 'Expense request not found' });
    } else {
      res.status(500).json({ success: false, error: 'Failed to get expense details' });
    }
  }
});

// Approve an expense request
router.post('/:id/approve', [
  authenticateToken,
  isTreasurer,
  param('id').isInt().withMessage('Expense ID must be an integer'),
  validateRequest
], async (req, res) => {
  try {
    const approvedExpense = await expenseService.approveExpenseRequest(
      parseInt(req.params.id),
      req.user.userId
    );
    res.json({ success: true, expense: approvedExpense });
  } catch (error) {
    console.error('Error approving expense:', error);
    if (error.message === 'Expense request not found') {
      res.status(404).json({ success: false, error: 'Expense request not found' });
    } else if (error.message === 'Expense request is not pending') {
      res.status(400).json({ success: false, error: 'Expense request is not pending' });
    } else {
      res.status(500).json({ success: false, error: 'Failed to approve expense' });
    }
  }
});

// Deny an expense request
router.post('/:id/deny', [
  authenticateToken,
  isTreasurer,
  param('id').isInt().withMessage('Expense ID must be an integer'),
  validateRequest
], async (req, res) => {
  try {
    const deniedExpense = await expenseService.denyExpenseRequest(
      parseInt(req.params.id),
      req.user.userId,
      req.body.reason
    );
    res.json({ success: true, expense: deniedExpense });
  } catch (error) {
    console.error('Error denying expense:', error);
    if (error.message === 'Expense request not found') {
      res.status(404).json({ success: false, error: 'Expense request not found' });
    } else if (error.message === 'Expense request is not pending') {
      res.status(400).json({ success: false, error: 'Expense request is not pending' });
    } else {
      res.status(500).json({ success: false, error: 'Failed to deny expense' });
    }
  }
});

module.exports = router;
