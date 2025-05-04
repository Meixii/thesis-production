const express = require('express');
const router = express.Router();
const { createGroup, getGroup, getGroupLimits, getGroupDashboard, regenerateGroupCode } = require('../controllers/groupController');
const { authenticateToken } = require('../middleware/auth');

// Protected routes - require authentication
router.use(authenticateToken);

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

module.exports = router; 