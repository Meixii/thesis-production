const db = require('../config/db');
const { uploadToCloudinary } = require('../utils/cloudinary');

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

      // Check if the group is a section group
      const groupTypeResult = await client.query(
        'SELECT group_type FROM groups WHERE id = $1',
        [groupId]
      );
      const groupType = groupTypeResult.rows[0]?.group_type;
      if (groupType === 'section') {
        // Get all dues for this group
        const duesResult = await client.query(
          'SELECT id FROM dues WHERE group_id = $1',
          [groupId]
        );
        for (const due of duesResult.rows) {
          // Insert user_dues if not already present
          await client.query(
            'INSERT INTO user_dues (due_id, user_id, status) SELECT $1, $2, $3 WHERE NOT EXISTS (SELECT 1 FROM user_dues WHERE due_id = $1 AND user_id = $2)',
            [due.id, userId, 'pending']
          );
        }
      }

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
        SELECT id, group_name, group_type
        FROM groups
        WHERE id = $1
      `, [user.groupId]);
      
      if (groupResult.rows.length > 0) {
        group = {
          id: groupResult.rows[0].id,
          name: groupResult.rows[0].group_name,
          groupType: groupResult.rows[0].group_type
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

// List all dues assigned to the authenticated student
const getMyDues = async (req, res) => {
  const userId = req.user.userId;
  try {
    const result = await db.query(`
      SELECT 
        ud.id as user_due_id,
        d.id as due_id,
        d.title,
        d.description,
        d.total_amount_due,
        d.due_date,
        ud.status,
        ud.amount_paid,
        (d.total_amount_due - ud.amount_paid) as remaining,
        d.created_at
      FROM user_dues ud
      JOIN dues d ON ud.due_id = d.id
      WHERE ud.user_id = $1
      ORDER BY d.due_date DESC
    `, [userId]);
    res.json({
      success: true,
      data: result.rows.map(row => ({
        userDueId: row.user_due_id,
        dueId: row.due_id,
        title: row.title,
        description: row.description,
        totalAmountDue: Number(row.total_amount_due),
        dueDate: row.due_date,
        status: row.status,
        amountPaid: Number(row.amount_paid),
        remaining: Number(row.remaining),
        createdAt: row.created_at
      }))
    });
  } catch (err) {
    console.error('getMyDues error:', err);
    res.status(400).json({ success: false, error: err.message });
  }
};

// Get details and payment history for a specific due assigned to the student
const getMyDueDetails = async (req, res) => {
  const userId = req.user.userId;
  const dueId = req.params.dueId;
  try {
    // Get user_due record
    const userDueResult = await db.query(`
      SELECT ud.id as user_due_id, ud.status, ud.amount_paid, ud.last_payment_date, d.title, d.description, d.total_amount_due, d.due_date, d.created_at
      FROM user_dues ud
      JOIN dues d ON ud.due_id = d.id
      WHERE ud.user_id = $1 AND d.id = $2
      LIMIT 1
    `, [userId, dueId]);
    if (userDueResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Due not found for this user' });
    }
    const due = userDueResult.rows[0];
    // Get payment history for this user_due
    const paymentsResult = await db.query(`
      SELECT p.id, p.amount, p.method, p.status, p.reference_id, p.receipt_url, p.created_at, p.verified_at, pad.amount_allocated
      FROM payments p
      JOIN payment_allocations_dues pad ON pad.payment_id = p.id
      WHERE pad.user_due_id = $1 AND p.user_id = $2
      ORDER BY p.created_at DESC
    `, [due.user_due_id, userId]);
    res.json({
      success: true,
      data: {
        dueId: Number(dueId),
        userDueId: due.user_due_id,
        title: due.title,
        description: due.description,
        totalAmountDue: Number(due.total_amount_due),
        dueDate: due.due_date,
        status: due.status,
        amountPaid: Number(due.amount_paid),
        remaining: Number(due.total_amount_due) - Number(due.amount_paid),
        lastPaymentDate: due.last_payment_date,
        createdAt: due.created_at,
        payments: paymentsResult.rows.map(p => ({
          paymentId: p.id,
          amount: Number(p.amount),
          amountAllocated: Number(p.amount_allocated),
          method: p.method,
          status: p.status,
          referenceId: p.reference_id,
          receiptUrl: p.receipt_url,
          createdAt: p.created_at,
          verifiedAt: p.verified_at
        }))
      }
    });
  } catch (err) {
    console.error('getMyDueDetails error:', err);
    res.status(400).json({ success: false, error: err.message });
  }
};

// Submit a payment for a due
const payDue = async (req, res) => {
  const userId = req.user.userId;
  const dueId = req.params.dueId;
  const { amount, method, referenceId, notes } = req.body;
  const receiptFile = req.file;
  if (!amount || !method) {
    return res.status(400).json({ success: false, error: 'Amount and method are required' });
  }
  try {
    // Get user_due record
    const userDueResult = await db.query(`
      SELECT id, amount_paid, status FROM user_dues WHERE user_id = $1 AND due_id = $2 LIMIT 1
    `, [userId, dueId]);
    if (userDueResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Due not found for this user' });
    }
    const userDue = userDueResult.rows[0];
    // Get user's group and last name for Cloudinary metadata
    const userResult = await db.query('SELECT group_id, last_name FROM users WHERE id = $1', [userId]);
    if (!userResult.rows.length) {
      throw new Error('User not found');
    }
    const groupId = userResult.rows[0].group_id;
    const lastName = userResult.rows[0].last_name || 'Unknown';
    // Upload receipt if provided
    let receiptUrl = null;
    if (receiptFile) {
      try {
        const uploadResult = await uploadToCloudinary(receiptFile, {
          lastName,
          paymentMethod: method,
          userId
        });
        receiptUrl = uploadResult.secure_url;
      } catch (uploadError) {
        console.error('Receipt upload failed:', uploadError);
        if (process.env.NODE_ENV === 'production') {
          // Log the error but continue
          console.warn('Continuing payment processing without receipt image');
        } else {
          throw new Error('Receipt upload failed: ' + uploadError.message);
        }
      }
    }
    // Insert payment
    const paymentResult = await db.query(`
      INSERT INTO payments (user_id, group_id, amount, method, status, purpose, reference_id, receipt_url, notes)
      VALUES ($1, $2, $3, $4, 'pending_verification', $5, $6, $7, $8)
      RETURNING id, created_at
    `, [userId, groupId, amount, method, `Due Payment: ${dueId}`, referenceId || null, receiptUrl || null, notes || null]);
    const paymentId = paymentResult.rows[0].id;
    // Link payment to user_due
    await db.query(`
      INSERT INTO payment_allocations_dues (payment_id, user_due_id, amount_allocated)
      VALUES ($1, $2, $3)
    `, [paymentId, userDue.id, amount]);
    res.json({
      success: true,
      message: 'Payment submitted and pending verification',
      paymentId,
      createdAt: paymentResult.rows[0].created_at
    });
  } catch (err) {
    console.error('payDue error:', err);
    res.status(400).json({ success: false, error: err.message });
  }
};

module.exports = {
  joinGroup,
  getDashboardData,
  getMyDues,
  getMyDueDetails,
  payDue
}; 