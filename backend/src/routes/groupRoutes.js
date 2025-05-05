const express = require('express');
const router = express.Router();
const { createGroup, getGroup, getGroupLimits, getGroupDashboard, regenerateGroupCode, updateGroupSettings, getGroupMembers, getUserContributions } = require('../controllers/groupController');
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

// Update group settings (FC only)
router.put('/:groupId/settings', updateGroupSettings);

// Get all members in a group with their status (FC only)
router.get('/:groupId/members', getGroupMembers);

// Get detailed contribution history for a specific user (FC only)
router.get('/users/:userId/contributions', getUserContributions);

module.exports = router; 