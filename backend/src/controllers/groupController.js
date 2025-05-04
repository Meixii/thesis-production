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

/**
 * Get dashboard data for a specific group
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getGroupDashboard = async (req, res) => {
  try {
    const { groupId } = req.params;
    
    // Verify user is a finance coordinator of this group
    const userResult = await db.query(
      'SELECT role, group_id FROM users WHERE id = $1',
      [req.user.userId]
    );
    
    if (!userResult.rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userRole = userResult.rows[0].role;
    const userGroupId = userResult.rows[0].group_id;
    
    // Only finance coordinators can access this endpoint
    if (userRole !== 'finance_coordinator') {
      return res.status(403).json({ error: 'Only finance coordinators can access this dashboard' });
    }
    
    // Finance coordinators can only access their own group's dashboard
    if (userGroupId != groupId) {
      return res.status(403).json({ error: 'You can only access your own group\'s dashboard' });
    }
    
    // Get group information
    const groupResult = await db.query(
      'SELECT id, group_name, budget_goal FROM groups WHERE id = $1',
      [groupId]
    );
    
    if (!groupResult.rows.length) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    const group = groupResult.rows[0];
    
    // Get current week for filtering
    const currentDate = new Date();
    // Simple week calculation: get ISO week number of the year
    const currentWeek = Math.ceil((currentDate - new Date(currentDate.getFullYear(), 0, 1)) / 604800000);
    
    // Count unpaid members for current week
    const unpaidCountResult = await db.query(
      `SELECT COUNT(DISTINCT u.id) as unpaid_count
       FROM users u
       LEFT JOIN weekly_contributions wc ON u.id = wc.user_id AND wc.week_number = $1
       WHERE u.group_id = $2 
       AND (wc.status = 'unpaid' OR wc.status = 'late' OR wc.id IS NULL)`,
      [currentWeek, groupId]
    );
    
    // Sum of all verified payments (total collected)
    const totalCollectedResult = await db.query(
      `SELECT COALESCE(SUM(p.amount), 0) as total_collected
       FROM payments p
       JOIN users u ON p.user_id = u.id
       WHERE u.group_id = $1 
       AND p.status = 'verified'`,
      [groupId]
    );
    
    // Sum of all expenses
    const totalExpensesResult = await db.query(
      `SELECT COALESCE(SUM(amount), 0) as total_expenses
       FROM expenses
       WHERE group_id = $1`,
      [groupId]
    );
    
    // Active loans information (sum of disbursed but not fully repaid loans)
    const activeLoansResult = await db.query(
      `SELECT 
         COALESCE(SUM(l.amount), 0) as total_disbursed,
         COALESCE(SUM(l.total_amount_repaid), 0) as total_repaid
       FROM loans l
       JOIN users u ON l.borrower_id = u.id
       WHERE u.group_id = $1 
       AND l.status = 'disbursed' OR l.status = 'partially_repaid'`,
      [groupId]
    );
    
    // Calculate available balance
    const totalCollected = parseFloat(totalCollectedResult.rows[0].total_collected);
    const totalExpenses = parseFloat(totalExpensesResult.rows[0].total_expenses);
    const totalDisbursed = parseFloat(activeLoansResult.rows[0].total_disbursed);
    const totalRepaid = parseFloat(activeLoansResult.rows[0].total_repaid);
    
    const availableBalance = totalCollected - totalExpenses - (totalDisbursed - totalRepaid);
    
    // Get weekly collection data for visualization
    const weeklyCollectionsResult = await db.query(
      `SELECT 
         wc.week_number,
         COUNT(CASE WHEN wc.status = 'paid' THEN 1 END) as paid_count,
         COUNT(CASE WHEN wc.status IN ('unpaid', 'late') THEN 1 END) as unpaid_count,
         SUM(CASE WHEN wc.status = 'paid' THEN wc.amount_paid ELSE 0 END) as collected_amount
       FROM weekly_contributions wc
       JOIN users u ON wc.user_id = u.id
       WHERE u.group_id = $1
       GROUP BY wc.week_number
       ORDER BY wc.week_number
       LIMIT 10`,
      [groupId]
    );
    
    // Get expense categories for visualization
    const expenseCategoriesResult = await db.query(
      `SELECT 
         category,
         SUM(amount) as total_amount
       FROM expenses
       WHERE group_id = $1
       GROUP BY category
       ORDER BY total_amount DESC`,
      [groupId]
    );
    
    res.json({
      group: {
        id: group.id,
        name: group.group_name,
        budget_goal: parseFloat(group.budget_goal)
      },
      stats: {
        unpaid_members_count: parseInt(unpaidCountResult.rows[0].unpaid_count),
        total_collected: totalCollected,
        total_expenses: totalExpenses,
        available_balance: availableBalance,
        budget_progress: (availableBalance / parseFloat(group.budget_goal) * 100) || 0
      },
      visualizations: {
        weekly_collections: weeklyCollectionsResult.rows,
        expense_categories: expenseCategoriesResult.rows
      }
    });
  } catch (error) {
    console.error('Get group dashboard error:', error);
    res.status(500).json({ error: 'Server error while fetching group dashboard data' });
  }
};

/**
 * Generate a new invitation code for a group
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const regenerateGroupCode = async (req, res) => {
  try {
    const { groupId } = req.params;
    
    // Verify user is a finance coordinator of this group
    const userResult = await db.query(
      'SELECT role, group_id FROM users WHERE id = $1',
      [req.user.userId]
    );
    
    if (!userResult.rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userRole = userResult.rows[0].role;
    const userGroupId = userResult.rows[0].group_id;
    
    // Only finance coordinators can regenerate group codes
    if (userRole !== 'finance_coordinator') {
      return res.status(403).json({ error: 'Only finance coordinators can generate group codes' });
    }
    
    // Finance coordinators can only modify their own group
    if (userGroupId != groupId) {
      return res.status(403).json({ error: 'You can only manage your own group' });
    }
    
    // Generate a unique 8-character alphanumeric code
    const generateCode = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed similar looking characters (0, 1, I, O)
      let code = '';
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };
    
    // Keep generating until we find a unique code
    let isUnique = false;
    let newCode;
    
    while (!isUnique) {
      newCode = generateCode();
      
      // Check if code already exists
      const existingCode = await db.query(
        'SELECT id FROM groups WHERE group_code = $1',
        [newCode]
      );
      
      if (!existingCode.rows.length) {
        isUnique = true;
      }
    }
    
    // Update the group with the new code
    const updateResult = await db.query(
      'UPDATE groups SET group_code = $1 WHERE id = $2 RETURNING group_code, group_name',
      [newCode, groupId]
    );
    
    if (!updateResult.rows.length) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    res.json({
      message: 'Group code regenerated successfully',
      group_code: updateResult.rows[0].group_code,
      group_name: updateResult.rows[0].group_name
    });
  } catch (error) {
    console.error('Regenerate group code error:', error);
    res.status(500).json({ error: 'Server error while regenerating group code' });
  }
};

module.exports = {
  createGroup,
  getGroup,
  getGroupLimits,
  getGroupDashboard,
  regenerateGroupCode
}; 