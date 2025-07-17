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
  const userId = req.user.userId;

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

    // Get current thesis week from thesis_weeks table
    const currentDate = new Date();
    const currentWeekResult = await db.query(`
      SELECT id, week_number, start_date, end_date
      FROM thesis_weeks
      WHERE $1 BETWEEN start_date AND end_date
      LIMIT 1
    `, [currentDate]);

    // Initialize current week data
    let currentWeek = {
      startDate: null,
      endDate: null,
      status: 'unpaid',
      amountPaid: 0,
      amountDue: 10,
      penalty: 0,
      weekNumber: null
    };

    // If we found a current thesis week
    if (currentWeekResult.rows.length > 0) {
      const thesisWeek = currentWeekResult.rows[0];
      currentWeek.startDate = thesisWeek.start_date.toISOString().split('T')[0];
      currentWeek.endDate = thesisWeek.end_date.toISOString().split('T')[0];
      currentWeek.weekNumber = thesisWeek.week_number;
      currentWeek.amountDue = 10;

      // Get contribution status for this specific thesis week's start_date
      const weeklyContributionResult = await db.query(`
        SELECT 
          status,
          base_contribution_due,
          penalty_applied,
          amount_paid
        FROM weekly_contributions
        WHERE user_id = $1 
        AND week_start_date = $2
      `, [userId, thesisWeek.start_date]);

      if (weeklyContributionResult.rows.length > 0) {
        const contribution = weeklyContributionResult.rows[0];
        currentWeek.status = contribution.status;
        currentWeek.amountPaid = parseFloat(contribution.amount_paid) || 0;
        currentWeek.amountDue = parseFloat(contribution.base_contribution_due) || 10;
        currentWeek.penalty = parseFloat(contribution.penalty_applied) || 0;
      } else {
        // No weekly_contributions record exists for this user for this thesis_week
        // Defaults are already set: status 'unpaid', amountDue 10, amountPaid 0, penalty 0
      }
    } else {
      // No current thesis_week defined in the thesis_weeks table for today's date
      // The initialized defaults for currentWeek will be used.
      // Consider if an error or specific message should be sent to frontend
      // For now, it will appear as a generic unpaid week, which might be misleading.
      // Or, we could set a specific status like 'no_active_week'.
      // Let's keep it simple for now and rely on frontend to guide if no weekNumber.
    }

    // Get total contributions from verified payments
    const totalContributedResult = await db.query(`
      SELECT COALESCE(SUM(amount), 0) as total_contributed
      FROM payments
      WHERE user_id = $1 AND status = 'verified'
    `, [userId]);

    // Get outstanding balance from weekly_contributions
    const outstandingBalanceResult = await db.query(`
      SELECT COALESCE(SUM(
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

    // Get group expenses if user has a group
    let expenses = [];
    if (user.groupId) {
      const expensesResult = await db.query(`
        SELECT 
          e.id, 
          e.description, 
          CAST(e.amount AS FLOAT) as amount,
          e.category, 
          e.expense_date, 
          e.receipt_url, 
          e.created_at, 
          u.first_name || ' ' || u.last_name as recorded_by_name,
          CAST(COALESCE(e.quantity, 1) AS FLOAT) as quantity,
          e.unit, 
          e.type, 
          e.status
        FROM expenses e
        LEFT JOIN users u ON e.recorded_by_user_id = u.id
        WHERE e.group_id = $1
        ORDER BY e.expense_date DESC
        LIMIT 10
      `, [user.groupId]);
      expenses = expensesResult.rows.map(row => ({
        ...row,
        amount: parseFloat(row.amount),
        quantity: parseFloat(row.quantity || 1)
      }));
    }

    res.json({
      success: true,
      data: {
        user,
        group,
        currentWeek,
        finances: {
          totalContributed: totalContributedResult.rows[0].total_contributed,
          outstandingBalance: outstandingBalanceResult.rows[0].outstanding_balance
        },
        activeLoans: loansResult.rows,
        expenses: expenses
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
        d.payment_method_restriction,
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
        paymentMethodRestriction: row.payment_method_restriction,
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
      SELECT ud.id as user_due_id, ud.status, ud.amount_paid, ud.last_payment_date, d.title, d.description, d.total_amount_due, d.due_date, d.payment_method_restriction, d.created_at
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
        paymentMethodRestriction: due.payment_method_restriction,
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

  // Validate payment method
  if (!['gcash', 'maya', 'cash'].includes(method)) {
    return res.status(400).json({ success: false, error: 'Invalid payment method' });
  }
  try {
    // Get user_due record and due details
    const userDueResult = await db.query(`
      SELECT ud.id, ud.amount_paid, ud.status, d.payment_method_restriction 
      FROM user_dues ud
      JOIN dues d ON ud.due_id = d.id
      WHERE ud.user_id = $1 AND ud.due_id = $2 LIMIT 1
    `, [userId, dueId]);
    if (userDueResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Due not found for this user' });
    }
    const userDue = userDueResult.rows[0];

    // Check payment method restriction
    const restriction = userDue.payment_method_restriction;
    if (restriction === 'online_only' && method === 'cash') {
      return res.status(400).json({ success: false, error: 'This due only accepts online payments (GCash or Maya)' });
    }
    if (restriction === 'cash_only' && (method === 'gcash' || method === 'maya')) {
      return res.status(400).json({ success: false, error: 'This due only accepts cash payments' });
    }
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

// Get all payments for the authenticated user (payment history)
const getMyPaymentHistory = async (req, res) => {
  const userId = req.user.userId;
  try {
    const result = await db.query(`
      SELECT id, amount, method, status, reference_id, receipt_url, created_at, verified_at, purpose
      FROM payments
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [userId]);
    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error('getMyPaymentHistory error:', err);
    res.status(400).json({ success: false, error: err.message });
  }
};

// New function to get all payable weeks for a student
const getPayableWeeks = async (req, res) => {
  const userId = req.user.userId;
  const currentDate = new Date(); // Keep as Date object for comparisons
  const currentDateString = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD format for query

  const client = await db.connect(); // Use a single client for potential updates

  // Helper function to format Date objects as YYYY-MM-DD without timezone shift
  const formatDate = (dateObj) => {
    if (!dateObj || !(dateObj instanceof Date)) {
        // Handle cases where the date might be null or not a Date object
        // This might happen if pg returns strings for dates sometimes
        if (typeof dateObj === 'string') return dateObj.split('T')[0]; // Assume correct format if string
        return null; // Or throw an error, depending on desired handling
    }
    const year = dateObj.getFullYear();
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0'); // Month is 0-indexed
    const day = dateObj.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  try {
    const thesisWeeksResult = await client.query(
      'SELECT id, week_number, start_date, end_date FROM thesis_weeks WHERE start_date <= $1 ORDER BY week_number ASC',
      [currentDateString]
    );

    if (!thesisWeeksResult.rows.length) {
      return res.json({ success: true, data: [], message: "No thesis weeks found or defined yet." });
    }

    const payableWeeks = [];
    let penaltyAppliedInLoop = false; // Flag to track if we modified penalties

    for (const tw of thesisWeeksResult.rows) {
      let weekContribution = {
        thesis_week_id: tw.id,
        week_number: tw.week_number,
        week_start_date: formatDate(tw.start_date),
        week_end_date: formatDate(tw.end_date),
        status: 'unpaid',
        base_due: 10.00,
        penalty_applied: 0.00,
        amount_paid_for_week: 0.00,
        total_due_for_week: 10.00,
        amount_remaining_for_week: 10.00
      };

      const wcResult = await client.query(
        'SELECT id, status, base_contribution_due, penalty_applied, amount_paid ' +
        'FROM weekly_contributions WHERE user_id = $1 AND week_start_date = $2::DATE',
        [userId, weekContribution.week_start_date]
      );

      let contributionId = null;
      if (wcResult.rows.length > 0) {
        const wc = wcResult.rows[0];
        contributionId = wc.id;
        weekContribution.status = wc.status;
        weekContribution.base_due = parseFloat(wc.base_contribution_due);
        weekContribution.penalty_applied = parseFloat(wc.penalty_applied) || 0;
        weekContribution.amount_paid_for_week = parseFloat(wc.amount_paid) || 0;
      } else {
        // If no record exists, it implies unpaid for this past/current week
        // We won't create it here, but calculate potential due/penalty
        // A record will be created upon first payment attempt for this week
      }

      // --- Penalty Calculation Logic --- 
      const weekEndDate = new Date(tw.end_date); // Use the actual date object for comparison
      // Check if the week is overdue and still not paid/pending
      if (currentDate > weekEndDate && weekContribution.status !== 'paid' && weekContribution.status !== 'pending_verification') {
        const expectedPenalty = 1.00; // Flat 1 PHP penalty
        // Only apply penalty if it hasn't been applied yet
        if (weekContribution.penalty_applied < expectedPenalty) {
          weekContribution.penalty_applied = expectedPenalty;
          // Update status to 'late' if it was 'unpaid'
          if (weekContribution.status === 'unpaid') {
            weekContribution.status = 'late';
          }

          // If a contribution record exists, update it in the DB
          if (contributionId) {
            try {
              await client.query(
                'UPDATE weekly_contributions SET penalty_applied = $1, status = $2, updated_at = NOW() WHERE id = $3',
                [weekContribution.penalty_applied, weekContribution.status, contributionId]
              );
              penaltyAppliedInLoop = true; // Indicate a change was made
               console.log(`Applied penalty for user ${userId}, week ${weekContribution.week_number}`);
            } catch (updateError) {
              console.error(`Failed to update penalty for contribution ID ${contributionId}:`, updateError);
              // Decide how to handle: continue without applying, or throw error?
              // For now, log error and continue, the calculated value will be shown anyway.
              weekContribution.penalty_applied = parseFloat(wcResult.rows[0].penalty_applied) || 0; // Revert if DB update failed
              weekContribution.status = wcResult.rows[0].status; // Revert status too
            }
          } else {
            // No record exists, status remains 'unpaid'/default, penalty is calculated but not saved yet.
             if (weekContribution.status === 'unpaid') {
               weekContribution.status = 'late'; // Mark as late conceptually even if no record
             }
          }
        }
      }
      // --- End Penalty Logic --- 

      // Recalculate final due/remaining amounts
      weekContribution.total_due_for_week = weekContribution.base_due + weekContribution.penalty_applied;
      weekContribution.amount_remaining_for_week = weekContribution.total_due_for_week - weekContribution.amount_paid_for_week;
      weekContribution.amount_remaining_for_week = Math.max(0, weekContribution.amount_remaining_for_week);

      // Only add if not fully paid (status check is sufficient)
      if (weekContribution.status !== 'paid') {
         payableWeeks.push(weekContribution);
      }
    }

    // Log the data being sent to the frontend for debugging
    console.log("Sending payableWeeks data:", JSON.stringify(payableWeeks, null, 2));

    res.json({ success: true, data: payableWeeks });

  } catch (err) {
    console.error('Get payable weeks error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch payable weeks.' });
  } finally {
      client.release(); // Release client connection
  }
};

// New function to get payable distributed expenses for the student
const getPayableExpenses = async (req, res) => {
  const userId = req.user.userId;

  try {
    // Get user's group ID
    const userResult = await db.query('SELECT group_id FROM users WHERE id = $1', [userId]);
    if (!userResult.rows.length || !userResult.rows[0].group_id) {
      return res.status(400).json({ success: false, error: 'User not found or not assigned to a group.' });
    }
    const groupId = userResult.rows[0].group_id;

    // Find expenses marked as distributed for the user's group
    // for which the user has NOT made a verified payment yet.
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
         AND p.status = 'verified' -- Only count verified payments
       )
       ORDER BY e.expense_date DESC`,
      [groupId, userId]
    );

    // Also fetch any pending payments for these expenses to inform the user
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
    console.error('Get payable expenses error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch payable expenses.' });
  }
};

module.exports = {
  joinGroup,
  getDashboardData,
  getMyDues,
  getMyDueDetails,
  payDue,
  getMyPaymentHistory,
  getPayableWeeks,
  getPayableExpenses
}; 