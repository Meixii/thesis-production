const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { joinGroup, getDashboardData } = require('../controllers/studentController');

// Protected routes - require authentication
router.use(authenticateToken);

// Join a thesis group
router.post('/join-group', joinGroup);

// Get student dashboard data
router.get('/dashboard', getDashboardData);

module.exports = router; 