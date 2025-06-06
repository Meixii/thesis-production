const db = require('../config/db');
const { uploadToCloudinary } = require('../utils/cloudinary');
const multer = require('multer');

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
       LEFT JOIN weekly_contributions wc ON u.id = wc.user_id AND EXTRACT(WEEK FROM wc.week_start_date) = $1
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
         COALESCE(SUM(l.amount_approved), 0) as total_disbursed,
         COALESCE(SUM(l.total_amount_repaid), 0) as total_repaid
       FROM loans l
       JOIN users u ON l.requesting_user_id = u.id
       WHERE u.group_id = $1 
       AND (l.status = 'disbursed' OR l.status = 'partially_repaid')`,
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
         EXTRACT(WEEK FROM wc.week_start_date) as week_number,
         COUNT(CASE WHEN wc.status = 'paid' THEN 1 END) as paid_count,
         COUNT(CASE WHEN wc.status IN ('unpaid', 'late') THEN 1 END) as unpaid_count,
         SUM(CASE WHEN wc.status = 'paid' THEN wc.amount_paid ELSE 0 END) as collected_amount
       FROM weekly_contributions wc
       JOIN users u ON wc.user_id = u.id
       WHERE u.group_id = $1
       GROUP BY EXTRACT(WEEK FROM wc.week_start_date)
       ORDER BY EXTRACT(WEEK FROM wc.week_start_date)
       LIMIT 10`,
      [groupId]
    );
    
    // Get expense categories for visualization
    const expenseCategoriesResult = await db.query(
      `SELECT 
         COALESCE(description, 'Uncategorized') as category,
         SUM(amount) as total_amount
       FROM expenses
       WHERE group_id = $1
       GROUP BY description
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
        weekly_collections: weeklyCollectionsResult.rows.map(row => ({
          ...row,
          week_number: parseInt(row.week_number)
        })),
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

/**
 * Update group settings (FC only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateGroupSettings = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { group_name, budget_goal, max_intra_loan_per_student, max_inter_loan_limit, intra_loan_flat_fee } = req.body;

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

    if (userRole !== 'finance_coordinator') {
      return res.status(403).json({ error: 'Only finance coordinators can update group settings' });
    }
    if (userGroupId != groupId) {
      return res.status(403).json({ error: 'You can only update your own group' });
    }

    // Update group settings
    const updateResult = await db.query(
      `UPDATE groups SET
        group_name = $1,
        budget_goal = $2,
        max_intra_loan_per_student = $3,
        max_inter_loan_limit = $4,
        intra_loan_flat_fee = $5
      WHERE id = $6
      RETURNING id, group_name, group_code, budget_goal, max_intra_loan_per_student, max_inter_loan_limit, intra_loan_flat_fee`,
      [group_name, budget_goal, max_intra_loan_per_student, max_inter_loan_limit, intra_loan_flat_fee, groupId]
    );

    if (!updateResult.rows.length) {
      return res.status(404).json({ error: 'Group not found' });
    }

    res.json({
      message: 'Group settings updated successfully',
      group: updateResult.rows[0]
    });
  } catch (error) {
    console.error('Update group settings error:', error);
    res.status(500).json({ error: 'Server error while updating group settings' });
  }
};

/**
 * Get all members in a specific group with their contribution and loan status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getGroupMembers = async (req, res) => {
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
      return res.status(403).json({ error: 'Only finance coordinators can access group members' });
    }
    
    // Finance coordinators can only access their own group's members
    if (userGroupId != groupId) {
      return res.status(403).json({ error: 'You can only access your own group\'s members' });
    }
    
    // Get current week for filtering
    const currentDate = new Date();
    
    // Find the current week from thesis_weeks table rather than calculating
    const currentWeekResult = await db.query(
      `SELECT id, week_number, start_date FROM thesis_weeks 
       WHERE $1 BETWEEN start_date AND end_date
       LIMIT 1`,
      [currentDate]
    );
    
    let currentWeek = null;
    if (currentWeekResult.rows.length > 0) {
      currentWeek = currentWeekResult.rows[0].week_number;
    } else {
      // Fallback to calculating week number if not found in thesis_weeks
      currentWeek = Math.ceil((currentDate - new Date(currentDate.getFullYear(), 0, 1)) / 604800000);
    }
    
    // Get all members with their contribution and loan status
    const membersResult = await db.query(
      `SELECT 
         u.id,
         u.first_name,
         u.last_name,
         u.email,
         u.role,
         (
           SELECT wc.status
           FROM weekly_contributions wc
           WHERE wc.user_id = u.id
           AND DATE_PART('week', wc.week_start_date) = DATE_PART('week', CURRENT_DATE)
           LIMIT 1
         ) as current_week_status,
         (
           SELECT COALESCE(SUM(wc.amount_paid), 0)
           FROM weekly_contributions wc
           WHERE wc.user_id = u.id
         ) as total_contributed,
         (
           SELECT COALESCE(SUM(wc.base_contribution_due + wc.penalty_applied - wc.amount_paid), 0)
           FROM weekly_contributions wc
           WHERE wc.user_id = u.id
           AND wc.status IN ('unpaid', 'late')
         ) as total_balance,
         (
           SELECT COALESCE(SUM(l.amount_approved - l.total_amount_repaid), 0)
           FROM loans l
           WHERE l.requesting_user_id = u.id
           AND l.status IN ('disbursed', 'partially_repaid')
         ) as active_loan_amount
       FROM users u
       WHERE u.group_id = $1
       ORDER BY u.last_name, u.first_name`,
      [groupId]
    );
    
    res.json({
      group_id: groupId,
      members: membersResult.rows.map(member => ({
        id: member.id,
        name: `${member.first_name} ${member.last_name}`,
        email: member.email,
        role: member.role,
        current_week_status: member.current_week_status || 'unpaid',
        total_contributed: parseFloat(member.total_contributed) || 0,
        total_balance: parseFloat(member.total_balance) || 0,
        active_loan_amount: parseFloat(member.active_loan_amount) || 0
      }))
    });
  } catch (error) {
    console.error('Get group members error:', error);
    res.status(500).json({ error: 'Server error while fetching group members' });
  }
};

/**
 * Get detailed contribution and payment history for a specific user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUserContributions = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verify user is a finance coordinator and has access to this user
    const currentUserResult = await db.query(
      'SELECT role, group_id FROM users WHERE id = $1',
      [req.user.userId]
    );
    
    if (!currentUserResult.rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userRole = currentUserResult.rows[0].role;
    const userGroupId = currentUserResult.rows[0].group_id;
    
    // Only finance coordinators can access this endpoint
    if (userRole !== 'finance_coordinator') {
      return res.status(403).json({ error: 'Only finance coordinators can access user contributions' });
    }
    
    // Check if the target user belongs to the finance coordinator's group
    const targetUserResult = await db.query(
      'SELECT id, first_name, last_name, email, group_id FROM users WHERE id = $1',
      [userId]
    );
    
    if (!targetUserResult.rows.length) {
      return res.status(404).json({ error: 'Target user not found' });
    }
    
    const targetUser = targetUserResult.rows[0];
    
    // Finance coordinators can only access users in their own group
    if (targetUser.group_id != userGroupId) {
      return res.status(403).json({ error: 'You can only access users in your own group' });
    }
    
    // Get user contributions (weekly)
    const contributionsResult = await db.query(
      `SELECT 
         wc.id,
         EXTRACT(WEEK FROM wc.week_start_date) as week_number,
         wc.week_start_date,
         wc.status,
         wc.base_contribution_due,
         wc.penalty_applied,
         wc.amount_paid,
         wc.updated_at
       FROM weekly_contributions wc
       WHERE wc.user_id = $1
       ORDER BY wc.week_start_date DESC`,
      [userId]
    );
    
    // Get user payments
    const paymentsResult = await db.query(
      `SELECT 
         p.id,
         p.amount,
         p.method,
         p.status,
         p.reference_id,
         p.receipt_url,
         p.created_at,
         p.verified_at,
         (
           SELECT CONCAT(u.first_name, ' ', u.last_name)
           FROM users u
           WHERE u.id = p.verified_by_user_id
         ) as verified_by
       FROM payments p
       WHERE p.user_id = $1
       ORDER BY p.created_at DESC`,
      [userId]
    );
    
    // Get user active loans
    const loansResult = await db.query(
      `SELECT 
         l.id,
         l.loan_type,
         l.amount_approved,
         l.fee_applied,
         l.status,
         l.total_amount_repaid,
         l.request_date,
         l.disbursement_date,
         l.due_date
       FROM loans l
       WHERE l.requesting_user_id = $1
       ORDER BY l.request_date DESC`,
      [userId]
    );
    
    res.json({
      user: {
        id: targetUser.id,
        name: `${targetUser.first_name} ${targetUser.last_name}`,
        email: targetUser.email
      },
      contributions: contributionsResult.rows.map(contribution => ({
        id: contribution.id,
        week_number: parseInt(contribution.week_number || 0),
        week_start_date: contribution.week_start_date,
        status: contribution.status,
        base_amount: parseFloat(contribution.base_contribution_due),
        penalty: parseFloat(contribution.penalty_applied),
        amount_paid: parseFloat(contribution.amount_paid),
        amount_due: parseFloat(contribution.base_contribution_due) + parseFloat(contribution.penalty_applied) - parseFloat(contribution.amount_paid),
        updated_at: contribution.updated_at
      })),
      payments: paymentsResult.rows.map(payment => ({
        id: payment.id,
        amount: parseFloat(payment.amount),
        method: payment.method,
        status: payment.status,
        reference_id: payment.reference_id,
        receipt_url: payment.receipt_url,
        created_at: payment.created_at,
        verified_at: payment.verified_at,
        verified_by: payment.verified_by
      })),
      loans: loansResult.rows.map(loan => ({
        id: loan.id,
        loan_type: loan.loan_type,
        amount: parseFloat(loan.amount_approved),
        fee: parseFloat(loan.fee_applied),
        status: loan.status,
        amount_repaid: parseFloat(loan.total_amount_repaid),
        amount_remaining: parseFloat(loan.amount_approved) - parseFloat(loan.total_amount_repaid),
        request_date: loan.request_date,
        disbursement_date: loan.disbursement_date,
        due_date: loan.due_date
      }))
    });
  } catch (error) {
    console.error('Get user contributions error:', error);
    res.status(500).json({ error: 'Server error while fetching user contributions' });
  }
};

/**
 * Get all payments pending verification for a group (Finance Coordinator only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getPendingPaymentsForGroup = async (req, res) => {
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
    if (userRole !== 'finance_coordinator') {
      return res.status(403).json({ error: 'Only finance coordinators can access pending payments' });
    }
    if (userGroupId != groupId) {
      return res.status(403).json({ error: 'You can only access your own group\'s payments' });
    }
    // Fetch all payments with status 'pending_verification' for users in the group
    const result = await db.query(
      `SELECT 
         p.id as payment_id,
         CONCAT(u.first_name, ' ', u.last_name) as user_name,
         u.email as user_email,
         p.amount,
         p.method,
         p.status,
         p.reference_id,
         p.receipt_url,
         p.created_at
       FROM payments p
       JOIN users u ON p.user_id = u.id
       WHERE u.group_id = $1 AND p.status = 'pending_verification'
       ORDER BY p.created_at ASC`,
      [groupId]
    );
    res.json({
      group_id: groupId,
      payments: result.rows
    });
  } catch (error) {
    console.error('Get pending payments for group error:', error);
    res.status(500).json({ error: 'Server error while fetching pending payments' });
  }
};

/**
 * Add a new expense for a group (Finance Coordinator only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const addExpense = async (req, res) => {
  const client = await db.connect(); // Use client for transaction
  try {
    const { groupId } = req.params;
    const { description, category, amount, quantity, unit, type, status, expense_date, is_distributed } = req.body;
    const receiptFile = req.file;
    const userId = req.user.userId;

    await client.query('BEGIN'); // Start transaction

    // Verify user is a finance coordinator of this group
    const userResult = await client.query(
      'SELECT role, group_id FROM users WHERE id = $1',
      [userId]
    );
    if (!userResult.rows.length) throw new Error('User not found');
    const userRole = userResult.rows[0].role;
    const userGroupId = userResult.rows[0].group_id;
    if (userRole !== 'finance_coordinator') throw new Error('Only finance coordinators can add expenses');
    if (userGroupId != groupId) throw new Error('You can only add expenses to your own group');

    let amountPerStudent = null;
    let finalIsDistributed = is_distributed === 'true';

    if (finalIsDistributed) {
      if (!amount || parseFloat(amount) <= 0) {
         throw new Error('Cannot distribute an expense with zero or negative amount.');
      }
      // Calculate amount per student
      const memberCountResult = await client.query(
        'SELECT COUNT(*) as count FROM users WHERE group_id = $1 AND is_active = TRUE',
        [groupId]
      );
      const memberCount = parseInt(memberCountResult.rows[0].count, 10);
      if (memberCount > 0) {
        amountPerStudent = Math.ceil(parseFloat(amount) / memberCount);
        console.log(`Distributing expense: Total ${amount}, Members ${memberCount}, Per Student (Ceiling): ${amountPerStudent}`);
      } else {
         // Cannot distribute if there are no active members
         finalIsDistributed = false; // Revert distribution if no members
         console.warn(`Cannot distribute expense for group ${groupId} as it has no active members.`);
      }
    }

    // Upload receipt if provided (keep existing logic)
    let receiptUrl = null;
    if (receiptFile) {
      try {
        const uploadResult = await uploadToCloudinary(receiptFile, { expenseReceipt: true, category, amount, quantity: quantity || 1, unit: unit || 'pcs' });
        receiptUrl = uploadResult.secure_url;
      } catch (uploadError) {
        console.error('Receipt upload failed during expense add:', uploadError);
        // Decide handling: throw, warn, proceed?
        // Let's proceed but log warning, as receipt isn't strictly essential for the record.
        console.warn('Proceeding with expense creation without receipt due to upload error.');
      }
    }

    // Create expense record
    const result = await client.query(
      `INSERT INTO expenses (
        group_id, recorded_by_user_id, description, category, amount,
        quantity, unit, type, status, expense_date, receipt_url,
        is_distributed, amount_per_student, 
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, description, category, amount, quantity, unit, type, status, expense_date, receipt_url, created_at, updated_at, is_distributed, amount_per_student`,
      [
        groupId, userId, description, category, amount,
        quantity || 1, unit || 'pcs', type || 'actual', status || 'planned',
        expense_date || new Date(), receiptUrl,
        finalIsDistributed, amountPerStudent // Add new fields
      ]
    );

    await client.query('COMMIT'); // Commit transaction

    res.status(201).json({
      message: 'Expense added successfully',
      expense: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK'); // Rollback on error
    console.error('Add expense error:', error);
    res.status(500).json({ error: error.message || 'Server error while adding expense' });
  } finally {
      client.release(); // Release client
  }
};

/**
 * Update an expense (Finance Coordinator only)
 */
const updateExpense = async (req, res) => {
  const client = await db.connect();
  try {
    const { groupId, expenseId } = req.params;
    const { description, category, amount, quantity, unit, type, status, expense_date, is_distributed } = req.body;
    const receiptFile = req.file;
    const userId = req.user.userId;

    await client.query('BEGIN');

    // Verify user is a finance coordinator of this group
    const userResult = await client.query('SELECT role, group_id FROM users WHERE id = $1', [userId]);
    if (!userResult.rows.length) throw new Error('User not found');
    const userRole = userResult.rows[0].role;
    const userGroupId = userResult.rows[0].group_id;
    if (userRole !== 'finance_coordinator') throw new Error('Only finance coordinators can edit expenses');
    if (userGroupId != groupId) throw new Error('You can only edit expenses in your own group');

    // Fetch the current expense amount if amount is changing and distribution is intended
    const currentExpenseResult = await client.query('SELECT amount FROM expenses WHERE id = $1 AND group_id = $2', [expenseId, groupId]);
     if (!currentExpenseResult.rows.length) {
        throw new Error('Expense not found');
    }
    const currentAmount = parseFloat(currentExpenseResult.rows[0].amount);
    const newAmount = (amount !== undefined) ? parseFloat(amount) : currentAmount;

    // Build update query parts
    let updateFields = [];
    let updateValues = [];
    let idx = 1;

    // Helper to add field and value
    const addUpdate = (field, value) => {
        if (value !== undefined && value !== null) { // Check for undefined AND null
             updateFields.push(`${field} = $${idx++}`);
             updateValues.push(value);
        }
    };

    addUpdate('description', description);
    addUpdate('category', category);
    addUpdate('amount', amount); // Add the new amount if provided
    addUpdate('quantity', quantity);
    addUpdate('unit', unit);
    addUpdate('type', type);
    addUpdate('status', status);
    addUpdate('expense_date', expense_date);

    // Handle distribution logic
    let finalIsDistributedUpdateIntent = is_distributed !== undefined ? (is_distributed === 'true') : undefined;
    let amountPerStudent = null;

    if (finalIsDistributedUpdateIntent !== undefined) {
       addUpdate('is_distributed', finalIsDistributedUpdateIntent); 
       if (finalIsDistributedUpdateIntent) {
         if (newAmount <= 0) {
            throw new Error('Cannot distribute an expense with zero or negative amount.');
         }
          const memberCountResult = await client.query('SELECT COUNT(*) as count FROM users WHERE group_id = $1 AND is_active = TRUE', [groupId]);
          const memberCount = parseInt(memberCountResult.rows[0].count, 10);
          if (memberCount > 0) {
            amountPerStudent = Math.ceil(newAmount / memberCount);
             addUpdate('amount_per_student', amountPerStudent);
          } else {
              addUpdate('is_distributed', false);
              addUpdate('amount_per_student', null);
          }
       } else {
          addUpdate('amount_per_student', null);
       }
    } else {
       // If is_distributed flag was NOT passed, but amount changed, recalculate if previously distributed
       if (amount !== undefined) {
           const checkDistributionStatus = await client.query('SELECT is_distributed FROM expenses WHERE id = $1', [expenseId]);
           if(checkDistributionStatus.rows.length > 0 && checkDistributionStatus.rows[0].is_distributed) {
                const memberCountResult = await client.query('SELECT COUNT(*) as count FROM users WHERE group_id = $1 AND is_active = TRUE', [groupId]);
                const memberCount = parseInt(memberCountResult.rows[0].count, 10);
                 if (memberCount > 0 && newAmount > 0) {
                    amountPerStudent = Math.ceil(newAmount / memberCount);
                    addUpdate('amount_per_student', amountPerStudent);
                 } else { 
                     addUpdate('is_distributed', false);
                     addUpdate('amount_per_student', null);
                 }
           }
       }
    }

    // Handle receipt upload (similar to addExpense)
    let receiptUrl = null;
    if (receiptFile) {
      try {
        const uploadResult = await uploadToCloudinary(receiptFile, { expenseReceipt: true, category, amount: newAmount, quantity: quantity || 1, unit: unit || 'pcs' });
        receiptUrl = uploadResult.secure_url;
        addUpdate('receipt_url', receiptUrl);
      } catch (uploadError) {
        console.error('Receipt upload failed during expense update:', uploadError);
        console.warn('Proceeding with expense update without changing receipt due to upload error.');
      }
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    if (updateFields.length <= 1) { // <= 1 because updated_at is always added
      throw new Error('No valid fields provided for update');
    }

    // Add WHERE clause values
    updateValues.push(expenseId);
    updateValues.push(groupId);

    const result = await client.query(
      `UPDATE expenses SET ${updateFields.join(', ')} WHERE id = $${idx++} AND group_id = $${idx} RETURNING *`,
      updateValues
    );
    if (result.rows.length === 0) {
      // Should have been caught by the earlier check, but good failsafe
      throw new Error('Expense not found or update failed');
    }

    await client.query('COMMIT');

    res.json({
      message: 'Expense updated successfully',
      expense: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update expense error:', error);
    res.status(500).json({ error: error.message || 'Server error while updating expense' });
  } finally {
      client.release();
  }
};

/**
 * Get all expenses for a group (Finance Coordinator only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getExpenses = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { startDate, endDate, category, status } = req.query;

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

    if (userRole !== 'finance_coordinator') {
      return res.status(403).json({ error: 'Only finance coordinators can view expenses' });
    }

    if (userGroupId != groupId) {
      return res.status(403).json({ error: 'You can only view your own group\'s expenses' });
    }

    // Build query with optional filters
    let query = `
      SELECT 
        e.id,
        e.description,
        e.category,
        e.amount,
        e.quantity,
        e.unit,
        e.type,
        e.status,
        e.expense_date,
        e.receipt_url,
        e.created_at,
        e.updated_at,
        e.is_distributed,
        e.amount_per_student,
        CONCAT(u.first_name, ' ', u.last_name) as recorded_by
      FROM expenses e
      JOIN users u ON e.recorded_by_user_id = u.id
      WHERE e.group_id = $1
    `;
    const queryParams = [groupId];

    if (startDate) {
      query += ` AND e.expense_date >= $${queryParams.length + 1}`;
      queryParams.push(startDate);
    }

    if (endDate) {
      query += ` AND e.expense_date <= $${queryParams.length + 1}`;
      queryParams.push(endDate);
    }

    if (category) {
      query += ` AND e.category = $${queryParams.length + 1}`;
      queryParams.push(category);
    }

    if (status) {
      query += ` AND e.status = $${queryParams.length + 1}`;
      queryParams.push(status);
    }

    query += ' ORDER BY e.expense_date DESC';

    const result = await db.query(query, queryParams);

    // Get expense summary
    const summaryResult = await db.query(
      `SELECT 
        COUNT(*) as total_count,
        COALESCE(SUM(amount), 0) as total_amount,
        COUNT(DISTINCT category) as category_count
      FROM expenses
      WHERE group_id = $1`,
      [groupId]
    );

    // Get category breakdown
    const categoryBreakdownResult = await db.query(
      `SELECT 
        category,
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as total_amount
      FROM expenses
      WHERE group_id = $1
      GROUP BY category
      ORDER BY total_amount DESC`,
      [groupId]
    );

    res.json({
      expenses: result.rows.map(expense => ({
        ...expense,
        amount: parseFloat(expense.amount),
        quantity: expense.quantity ? parseFloat(expense.quantity) : undefined,
        amount_per_student: expense.amount_per_student ? parseFloat(expense.amount_per_student) : null,
        is_distributed: expense.is_distributed
      })),
      summary: {
        ...summaryResult.rows[0],
        total_amount: parseFloat(summaryResult.rows[0].total_amount),
        by_category: categoryBreakdownResult.rows.map(cat => ({
          ...cat,
          total_amount: parseFloat(cat.total_amount)
        }))
      }
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ error: 'Server error while fetching expenses' });
  }
};

/**
 * Delete an expense (Finance Coordinator only)
 */
const deleteExpense = async (req, res) => {
  try {
    const { groupId, expenseId } = req.params;
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
    if (userRole !== 'finance_coordinator') {
      return res.status(403).json({ error: 'Only finance coordinators can delete expenses' });
    }
    if (userGroupId != groupId) {
      return res.status(403).json({ error: 'You can only delete expenses in your own group' });
    }
    // Delete expense
    const result = await db.query(
      'DELETE FROM expenses WHERE id = $1 AND group_id = $2 RETURNING id',
      [expenseId, groupId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ error: 'Server error while deleting expense' });
  }
};

/**
 * Get pending intra-group loan requests for a specific group
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getPendingIntraGroupLoans = async (req, res) => {
  const groupId = req.params.groupId;
  
  try {
    // Verify user is finance coordinator of the group
    const userId = req.user.userId;
    const userResult = await db.query(
      'SELECT role FROM users WHERE id = $1 AND group_id = $2',
      [userId, groupId]
    );

    if (!userResult.rows.length || userResult.rows[0].role !== 'finance_coordinator') {
      return res.status(403).json({
        success: false,
        error: 'You must be the finance coordinator of this group to view pending loans'
      });
    }

    // Get pending intra-group loans
    const loansResult = await db.query(`
      SELECT 
        l.id,
        l.loan_type,
        l.requesting_user_id,
        l.requesting_group_id,
        l.providing_group_id,
        l.amount_requested,
        l.fee_applied,
        l.status,
        l.request_date,
        l.due_date,
        CONCAT(u.first_name, ' ', u.last_name) as requesting_user_name
      FROM loans l
      JOIN users u ON l.requesting_user_id = u.id
      WHERE l.requesting_group_id = $1
      AND l.providing_group_id = $1
      AND l.loan_type = 'intra_group'
      AND l.status = 'requested'
      ORDER BY l.request_date DESC
    `, [groupId]);

    res.json({
      success: true,
      loans: loansResult.rows
    });
  } catch (err) {
    console.error('Error fetching pending intra-group loans:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending intra-group loans'
    });
  }
};

/**
 * Get pending inter-group loan requests (incoming) for a specific group
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getPendingInterGroupLoansIncoming = async (req, res) => {
  const groupId = req.params.groupId;
  
  try {
    // Verify user is finance coordinator of the group
    const userId = req.user.userId;
    const userResult = await db.query(
      'SELECT role FROM users WHERE id = $1 AND group_id = $2',
      [userId, groupId]
    );

    if (!userResult.rows.length || userResult.rows[0].role !== 'finance_coordinator') {
      return res.status(403).json({
        success: false,
        error: 'You must be the finance coordinator of this group to view pending loans'
      });
    }

    // Get pending inter-group loans where this group is the provider
    const loansResult = await db.query(`
      SELECT 
        l.id,
        l.loan_type,
        l.requesting_user_id,
        l.requesting_group_id,
        l.providing_group_id,
        l.amount_requested,
        l.fee_applied,
        l.status,
        l.request_date,
        l.due_date,
        CONCAT(u.first_name, ' ', u.last_name) as requesting_user_name
      FROM loans l
      JOIN users u ON l.requesting_user_id = u.id
      WHERE l.providing_group_id = $1
      AND l.requesting_group_id != $1
      AND l.loan_type = 'inter_group'
      AND l.status = 'requested'
      ORDER BY l.request_date DESC
    `, [groupId]);

    res.json({
      success: true,
      loans: loansResult.rows
    });
  } catch (err) {
    console.error('Error fetching pending inter-group loans:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending inter-group loans'
    });
  }
};

// Get all thesis groups (id, group_name) for FC inter-group loan selection
const getAllGroups = async (req, res) => {
  try {
    const result = await db.query("SELECT id, group_name FROM groups WHERE group_type = 'thesis' ORDER BY group_name ASC");
    res.json(result.rows);
  } catch (error) {
    console.error('Get all groups error:', error);
    res.status(500).json({ error: 'Server error while fetching groups' });
  }
};

// New function to reset all weekly contributions for a group
const resetGroupContributions = async (req, res) => {
  const { groupId } = req.params;
  const fcUserId = req.user.userId; // Assuming authenticateToken middleware adds userId to req.user

  try {
    // Verify user is a finance coordinator of this group
    const userResult = await db.query(
      'SELECT role, group_id FROM users WHERE id = $1',
      [fcUserId]
    );

    if (!userResult.rows.length) {
      return res.status(404).json({ success: false, error: 'Finance Coordinator not found' });
    }

    const userRole = userResult.rows[0].role;
    const userGroupId = userResult.rows[0].group_id;

    // This check is also done by isFinanceCoordinator middleware, but good for safety
    if (userRole !== 'finance_coordinator') {
      return res.status(403).json({ success: false, error: 'User is not authorized to perform this action' });
    }

    // Finance coordinators can only reset contributions for their own group
    if (parseInt(userGroupId, 10) !== parseInt(groupId, 10)) {
      return res.status(403).json({ success: false, error: 'Finance Coordinator can only reset contributions for their own group' });
    }

    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // Step 1: Delete payment allocations linked to the weekly contributions of the group
      // Need to find contribution_ids first
      const contributionIdsResult = await client.query(
        'SELECT id FROM weekly_contributions WHERE group_id = $1',
        [groupId]
      );

      if (contributionIdsResult.rows.length > 0) {
        const contributionIds = contributionIdsResult.rows.map(row => row.id);
        await client.query(
          'DELETE FROM payment_allocations WHERE contribution_id = ANY($1::int[])',
          [contributionIds]
        );
        // Also delete allocations from payment_allocations_dues if any contributions were linked there, though less likely
        // This part might be an overreach if weekly_contributions are never linked to dues.
        // For now, let's assume weekly contributions are only in `payment_allocations`.
      }

      // Step 2: Delete all weekly contributions for the group
      await client.query(
        'DELETE FROM weekly_contributions WHERE group_id = $1',
        [groupId]
      );

      await client.query('COMMIT');
      res.json({ success: true, message: 'All weekly contributions for the group have been reset successfully.' });

    } catch (transactionError) {
      await client.query('ROLLBACK');
      console.error('Reset group contributions transaction error:', transactionError);
      res.status(500).json({ success: false, error: 'Failed to reset contributions due to a server error.' });
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Reset group contributions error:', error);
    res.status(500).json({ success: false, error: 'An unexpected error occurred.' });
  }
};

// Add after getExpenses
const getPayableExpensesForMember = async (req, res) => {
  const userId = req.user.userId;
  const { groupId } = req.params;

  try {
    // Check user is a member of the group and is student or FC
    const userResult = await db.query(
      'SELECT id, group_id, role FROM users WHERE id = $1',
      [userId]
    );
    if (!userResult.rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = userResult.rows[0];
    if (user.group_id != groupId || !['student', 'finance_coordinator'].includes(user.role)) {
      return res.status(403).json({ error: 'Not authorized for this group' });
    }

    // Use the same logic as studentController.js
    const expensesResult = await db.query(
      `SELECT 
         e.id AS expense_id,
         e.description,
         e.amount_per_student,
         e.expense_date
       FROM expenses e
       WHERE e.group_id = $1
       AND e.is_distributed = TRUE
       AND e.amount_per_student IS NOT NULL
       AND e.amount_per_student > 0
       AND NOT EXISTS (
         SELECT 1
         FROM expense_payments ep
         JOIN payments p ON ep.payment_id = p.id
         WHERE ep.expense_id = e.id
         AND ep.user_id = $2
         AND p.status = 'verified'
       )
       ORDER BY e.expense_date DESC`,
      [groupId, userId]
    );

    // Also fetch any pending payments for these expenses
    const pendingExpensePaymentResult = await db.query(
      `SELECT ep.expense_id
         FROM expense_payments ep
         JOIN payments p ON ep.payment_id = p.id
         WHERE ep.user_id = $1 AND p.status = 'pending_verification'`,
      [userId]
    );
    const pendingExpenseIds = new Set(pendingExpensePaymentResult.rows.map(r => r.expense_id));

    const payableExpenses = expensesResult.rows.map(exp => ({
      expense_id: exp.expense_id,
      description: exp.description,
      amount_due: parseFloat(exp.amount_per_student),
      expense_date: exp.expense_date,
      status: pendingExpenseIds.has(exp.expense_id) ? 'pending_verification' : 'due'
    }));

    res.json({ success: true, data: payableExpenses });

  } catch (err) {
    console.error('Get payable expenses for member error:', err);
    res.status(500).json({ error: 'Server error while fetching payable expenses' });
  }
};

/**
 * Get payment status of all group members for a specific expense
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getExpenseMemberStatus = async (req, res) => {
  try {
    const { groupId, expenseId } = req.params;
    const requesterId = req.user.userId;

    // Verify requester is FC of the group
    const userResult = await db.query(
      'SELECT role, group_id FROM users WHERE id = $1',
      [requesterId]
    );
    if (!userResult.rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }
    const userRole = userResult.rows[0].role;
    const userGroupId = userResult.rows[0].group_id;
    if (userRole !== 'finance_coordinator' || userGroupId != groupId) {
      return res.status(403).json({ error: 'Only the finance coordinator of this group can access this data' });
    }

    // Get all active members of the group
    const membersResult = await db.query(
      `SELECT id as user_id, first_name, last_name, email, role
       FROM users
       WHERE group_id = $1 AND is_active = TRUE
       ORDER BY last_name, first_name`,
      [groupId]
    );

    // For each member, check payment status and details for this expense
    const memberStatuses = await Promise.all(membersResult.rows.map(async (member) => {
      // Get the most recent payment for this expense by this user (verified or pending_verification)
      const paymentResult = await db.query(
        `SELECT p.status, p.method, p.reference_id, p.receipt_url
         FROM expense_payments ep
         JOIN payments p ON ep.payment_id = p.id
         WHERE ep.expense_id = $1 AND ep.user_id = $2 AND p.status IN ('verified', 'pending_verification')
         ORDER BY p.status = 'verified' DESC, p.created_at DESC
         LIMIT 1`,
        [expenseId, member.user_id]
      );
      let status = 'not_paid';
      let method = null;
      let reference_id = null;
      let receipt_url = null;
      if (paymentResult.rows.length > 0) {
        status = paymentResult.rows[0].status;
        method = paymentResult.rows[0].method;
        reference_id = paymentResult.rows[0].reference_id;
        receipt_url = paymentResult.rows[0].receipt_url;
      }
      return {
        ...member,
        name: `${member.first_name} ${member.last_name}`,
        status,
        method,
        reference_id,
        receipt_url
      };
    }));

    res.json({ success: true, data: memberStatuses });
  } catch (error) {
    console.error('Get expense member status error:', error);
    res.status(500).json({ error: 'Server error while fetching expense member status' });
  }
};

/**
 * Update group payment QR codes (GCash/Maya)
 * PATCH /api/groups/:groupId/qr
 * Only FC of the group can update
 */
const updateGroupQRCodes = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.userId;
    // Check if user is FC of the group
    const userResult = await db.query('SELECT role, group_id FROM users WHERE id = $1', [userId]);
    if (!userResult.rows.length) return res.status(404).json({ error: 'User not found' });
    const userRole = userResult.rows[0].role;
    const userGroupId = userResult.rows[0].group_id;
    if ((userRole !== 'finance_coordinator' && userRole !== 'treasurer') || userGroupId != groupId) {
      return res.status(403).json({ error: 'Only the finance coordinator or treasurer of this group can update QR codes' });
    }

    // Fetch group code for filename
    const groupResult = await db.query('SELECT group_code FROM groups WHERE id = $1', [groupId]);
    const groupCode = groupResult.rows.length ? groupResult.rows[0].group_code : 'GROUP';

    let gcashQrUrl = null;
    let mayaQrUrl = null;
    // Handle file uploads
    if (req.files && req.files['gcash_qr'] && req.files['gcash_qr'][0]) {
      const uploadResult = await uploadToCloudinary(req.files['gcash_qr'][0], { groupQr: true, groupCode, method: 'gcash' });
      gcashQrUrl = uploadResult.secure_url;
    }
    if (req.files && req.files['maya_qr'] && req.files['maya_qr'][0]) {
      const uploadResult = await uploadToCloudinary(req.files['maya_qr'][0], { groupQr: true, groupCode, method: 'maya' });
      mayaQrUrl = uploadResult.secure_url;
    }
    // Update group record
    let updateFields = [];
    let updateValues = [];
    let idx = 1;
    if (gcashQrUrl) {
      updateFields.push(`gcash_qr_url = $${idx++}`);
      updateValues.push(gcashQrUrl);
    }
    if (mayaQrUrl) {
      updateFields.push(`maya_qr_url = $${idx++}`);
      updateValues.push(mayaQrUrl);
    }
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No QR code uploaded' });
    }
    updateValues.push(groupId);
    const updateQuery = `UPDATE groups SET ${updateFields.join(', ')} WHERE id = $${idx} RETURNING gcash_qr_url, maya_qr_url`;
    const result = await db.query(updateQuery, updateValues);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Update group QR codes error:', err);
    res.status(500).json({ error: 'Server error while updating group QR codes' });
  }
};

module.exports = {
  createGroup,
  getGroup,
  getGroupLimits,
  getGroupDashboard,
  regenerateGroupCode,
  updateGroupSettings,
  getGroupMembers,
  getUserContributions,
  getPendingPaymentsForGroup,
  addExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
  getPendingIntraGroupLoans,
  getPendingInterGroupLoansIncoming,
  getAllGroups,
  resetGroupContributions,
  getPayableExpensesForMember,
  getExpenseMemberStatus,
  updateGroupQRCodes
}; 