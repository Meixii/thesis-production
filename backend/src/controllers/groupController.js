const db = require('../config/db');

const createGroup = async (req, res) => {
  try {
    const {
      group_name,
      budget_goal = 0.00,
      max_intra_loan_per_student = 100.00,
      max_inter_loan_limit = 500.00,
      intra_loan_flat_fee = 10.00
    } = req.body;

    // Check if group name already exists
    const existingGroup = await db.query(
      'SELECT id FROM groups WHERE group_name = $1',
      [group_name]
    );

    if (existingGroup.rows[0]) {
      return res.status(400).json({ error: 'Group name already exists' });
    }

    // Create new group
    const result = await db.query(
      `INSERT INTO groups (
        group_name,
        budget_goal,
        max_intra_loan_per_student,
        max_inter_loan_limit,
        intra_loan_flat_fee
      ) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        group_name,
        budget_goal,
        max_intra_loan_per_student,
        max_inter_loan_limit,
        intra_loan_flat_fee
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ error: 'Server error during group creation' });
  }
};

const getGroup = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'SELECT * FROM groups WHERE id = $1',
      [id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Group not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({ error: 'Server error while fetching group' });
  }
};

/**
 * Get loan limits for a specific group
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getGroupLimits = async (req, res) => {
  try {
    const { groupId } = req.params;
    
    // Verify user belongs to this group or is a finance coordinator
    const userGroupResult = await db.query(
      'SELECT group_id, role FROM users WHERE id = $1',
      [req.user.userId]
    );
    
    if (!userGroupResult.rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userGroup = userGroupResult.rows[0].group_id;
    const userRole = userGroupResult.rows[0].role;
    
    // Only allow access if user is part of the group or is a finance coordinator
    if (userGroup != groupId && userRole !== 'finance_coordinator') {
      return res.status(403).json({ error: 'You do not have permission to view this group\'s limits' });
    }
    
    // Get group limits
    const groupResult = await db.query(
      `SELECT 
        id, 
        group_name, 
        budget_goal, 
        max_intra_loan_per_student, 
        max_inter_loan_limit, 
        intra_loan_flat_fee
      FROM groups
      WHERE id = $1`,
      [groupId]
    );
    
    if (!groupResult.rows.length) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    res.json(groupResult.rows[0]);
  } catch (error) {
    console.error('Get group limits error:', error);
    res.status(500).json({ error: 'Server error while fetching group limits' });
  }
};

module.exports = {
  createGroup,
  getGroup,
  getGroupLimits
}; 