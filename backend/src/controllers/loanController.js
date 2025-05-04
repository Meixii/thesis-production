const db = require('../config/db');

/**
 * Request an intra-group loan
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const requestIntraLoan = async (req, res) => {
  const userId = req.user.userId;
  const { amount, dueDate } = req.body;

  try {
    // Start transaction
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // Get user's group
      const userResult = await client.query(
        'SELECT group_id FROM users WHERE id = $1',
        [userId]
      );

      if (!userResult.rows.length) {
        throw new Error('User not found');
      }

      const groupId = userResult.rows[0].group_id;
      
      if (!groupId) {
        throw new Error('User must be a member of a group to request a loan');
      }

      // Get group loan limits
      const groupResult = await client.query(
        'SELECT max_intra_loan_per_student, intra_loan_flat_fee FROM groups WHERE id = $1',
        [groupId]
      );

      if (!groupResult.rows.length) {
        throw new Error('Group not found');
      }

      const maxLoanAmount = groupResult.rows[0].max_intra_loan_per_student;
      const flatFee = groupResult.rows[0].intra_loan_flat_fee;

      // Validate amount
      if (parseFloat(amount) <= 0) {
        throw new Error('Loan amount must be greater than zero');
      }

      if (parseFloat(amount) > maxLoanAmount) {
        throw new Error(`Loan amount cannot exceed ${maxLoanAmount}`);
      }

      // Check if user has any active loans
      const activeLoansResult = await client.query(`
        SELECT COUNT(*) as count
        FROM loans
        WHERE requesting_user_id = $1
        AND status IN ('requested', 'approved', 'disbursed', 'partially_repaid')
      `, [userId]);

      if (parseInt(activeLoansResult.rows[0].count) > 0) {
        throw new Error('You already have an active loan. Please repay it before requesting a new one.');
      }

      // Validate due date
      const dueDateObj = new Date(dueDate);
      const now = new Date();
      
      if (dueDateObj <= now) {
        throw new Error('Due date must be in the future');
      }

      // Create loan record
      const loanResult = await client.query(`
        INSERT INTO loans (
          loan_type,
          requesting_user_id,
          requesting_group_id,
          providing_group_id,
          amount_requested,
          fee_applied,
          status,
          due_date
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `, [
        'intra_group',
        userId,
        groupId,
        groupId, // For intra-group loans, requesting and providing groups are the same
        amount,
        flatFee,
        'requested',
        dueDateObj
      ]);

      const loanId = loanResult.rows[0].id;

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Loan request submitted successfully',
        data: {
          loanId,
          status: 'requested',
          amount,
          fee: flatFee,
          dueDate
        }
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Loan request error:', err);
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

/**
 * Get loan details by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getLoanById = async (req, res) => {
  const userId = req.user.userId;
  const loanId = req.params.loanId;

  try {
    // Get loan details
    const loanResult = await db.query(`
      SELECT 
        l.id,
        l.loan_type,
        l.amount_requested,
        l.amount_approved,
        l.fee_applied,
        l.status,
        l.total_amount_repaid,
        l.request_date,
        l.approval_date,
        l.rejection_date,
        l.disbursement_date,
        l.due_date,
        l.disbursement_proof_url,
        l.disbursement_ref_id,
        rg.group_name as requesting_group_name,
        pg.group_name as providing_group_name,
        CONCAT(au.first_name, ' ', au.last_name) as approved_by_name,
        CONCAT(du.first_name, ' ', du.last_name) as disbursed_by_name
      FROM loans l
      LEFT JOIN groups rg ON l.requesting_group_id = rg.id
      LEFT JOIN groups pg ON l.providing_group_id = pg.id
      LEFT JOIN users au ON l.approved_by_user_id = au.id
      LEFT JOIN users du ON l.disbursed_by_user_id = du.id
      WHERE l.id = $1 AND l.requesting_user_id = $2
    `, [loanId, userId]);

    if (loanResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Loan not found or you do not have permission to view it'
      });
    }

    // Get repayment history if any
    const repaymentsResult = await db.query(`
      SELECT 
        lr.id,
        lr.amount,
        lr.repayment_date,
        CONCAT(u.first_name, ' ', u.last_name) as recorded_by_name,
        p.method as payment_method,
        p.receipt_url
      FROM loan_repayments lr
      JOIN payments p ON lr.payment_id = p.id
      JOIN users u ON lr.recorded_by_user_id = u.id
      WHERE lr.loan_id = $1
      ORDER BY lr.repayment_date DESC
    `, [loanId]);

    res.json({
      success: true,
      data: {
        loan: loanResult.rows[0],
        repayments: repaymentsResult.rows
      }
    });
  } catch (err) {
    console.error('Get loan details error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve loan details'
    });
  }
};

/**
 * Get all loans for the current user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUserLoans = async (req, res) => {
  const userId = req.user.userId;
  const { status } = req.query;

  try {
    let query = `
      SELECT 
        id,
        loan_type,
        amount_requested,
        amount_approved,
        fee_applied,
        status,
        total_amount_repaid,
        request_date,
        due_date
      FROM loans
      WHERE requesting_user_id = $1
    `;

    const queryParams = [userId];

    // Filter by status if provided
    if (status) {
      query += ` AND status = $2`;
      queryParams.push(status);
    }

    query += ` ORDER BY request_date DESC`;

    const loansResult = await db.query(query, queryParams);

    res.json({
      success: true,
      data: loansResult.rows
    });
  } catch (err) {
    console.error('Get user loans error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve loans'
    });
  }
};

module.exports = {
  requestIntraLoan,
  getLoanById,
  getUserLoans
}; 