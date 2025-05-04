const db = require('../config/db');

/**
 * Join a thesis group using a group code
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const joinGroup = async (req, res) => {
  const { groupCode } = req.body;
  
  // Fix: use userId from auth middleware (matches how getDashboardData uses it)
  const userId = req.user.userId || req.user.id; 

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: 'User ID not found in authentication token'
    });
  }

  if (!groupCode) {
    return res.status(400).json({
      success: false,
      error: 'Group code is required'
    });
  }

  try {
    // Start transaction
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // Check if user already has a group
      const userCheck = await client.query(
        'SELECT group_id FROM users WHERE id = $1',
        [userId]
      );

      if (userCheck.rows.length === 0) {
        throw new Error('User not found');
      }

      // Fix: handle case where group_id might be null
      if (userCheck.rows[0] && userCheck.rows[0].group_id) {
        throw new Error('User already belongs to a group');
      }

      // Find group by code
      const groupResult = await client.query(
        'SELECT id FROM groups WHERE group_code = $1',
        [groupCode]
      );

      if (groupResult.rows.length === 0) {
        throw new Error('Invalid group code');
      }

      const groupId = groupResult.rows[0].id;

      // Update user's group
      await client.query(
        'UPDATE users SET group_id = $1 WHERE id = $2',
        [groupId, userId]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Successfully joined group',
        groupId
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Join group error:', err);
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

/**
 * Get student dashboard data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getDashboardData = async (req, res) => {
  const userId = req.user.userId; // Changed from req.user.id to req.user.userId

  try {
    // Get user profile
    const userResult = await db.query(`
      SELECT 
        id, email, first_name, middle_name, last_name, suffix,
        role, group_id, profile_picture_url, email_verified
      FROM users 
      WHERE id = $1
    `, [userId]);

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = {
      id: userResult.rows[0].id,
      email: userResult.rows[0].email,
      firstName: userResult.rows[0].first_name,
      middleName: userResult.rows[0].middle_name,
      lastName: userResult.rows[0].last_name,
      suffix: userResult.rows[0].suffix,
      profilePictureUrl: userResult.rows[0].profile_picture_url,
      role: userResult.rows[0].role,
      groupId: userResult.rows[0].group_id,
      emailVerified: userResult.rows[0].email_verified
    };

    // Get group information if user has a group
    let group = null;
    if (user.groupId) {
      const groupResult = await db.query(`
        SELECT id, group_name
        FROM groups
        WHERE id = $1
      `, [user.groupId]);
      
      if (groupResult.rows.length > 0) {
        group = {
          id: groupResult.rows[0].id,
          name: groupResult.rows[0].group_name
        };
      }
    }

    // Get current week's data
    const currentDate = new Date();
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); // Start from Sunday
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const weeklyContributionResult = await db.query(`
      SELECT 
        status,
        base_contribution_due,
        penalty_applied,
        amount_paid
      FROM weekly_contributions
      WHERE user_id = $1 
      AND week_start_date = $2
    `, [userId, startOfWeek]);

    const currentWeek = {
      startDate: startOfWeek.toISOString(),
      endDate: endOfWeek.toISOString(),
      status: 'unpaid',
      amountPaid: 0,
      amountDue: 10,
      penalty: 0
    };

    if (weeklyContributionResult.rows.length > 0) {
      const contribution = weeklyContributionResult.rows[0];
      currentWeek.status = contribution.status;
      currentWeek.amountPaid = contribution.amount_paid;
      currentWeek.amountDue = contribution.base_contribution_due;
      currentWeek.penalty = contribution.penalty_applied;
    }

    // Get total contributions and outstanding balance
    const financesResult = await db.query(`
      SELECT 
        COALESCE(SUM(amount_paid), 0) as total_contributed,
        COALESCE(SUM(
          CASE 
            WHEN status = 'unpaid' OR status = 'late' 
            THEN base_contribution_due + penalty_applied - amount_paid
            ELSE 0
          END
        ), 0) as outstanding_balance
      FROM weekly_contributions
      WHERE user_id = $1
    `, [userId]);

    // Get active loans
    const loansResult = await db.query(`
      SELECT 
        id,
        amount_requested,
        amount_approved,
        fee_applied,
        COALESCE(
          (SELECT SUM(amount) FROM loan_repayments WHERE loan_id = loans.id),
          0
        ) as amount_repaid,
        due_date,
        status
      FROM loans
      WHERE requesting_user_id = $1
      AND status IN ('approved', 'disbursed', 'partially_repaid')
      ORDER BY created_at DESC
    `, [userId]);

    res.json({
      success: true,
      data: {
        user,
        group,
        currentWeek,
        finances: {
          totalContributed: financesResult.rows[0].total_contributed,
          outstandingBalance: financesResult.rows[0].outstanding_balance
        },
        activeLoans: loansResult.rows
      }
    });
  } catch (err) {
    console.error('Get dashboard data error:', err);
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

module.exports = {
  joinGroup,
  getDashboardData
}; 