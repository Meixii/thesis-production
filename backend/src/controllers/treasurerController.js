const db = require('../config/db');

/**
 * Get treasurer dashboard data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getDashboardData = async (req, res) => {
  try {
    // Only treasurer can access
    if (req.user.role !== 'treasurer') {
      return res.status(403).json({ error: 'Access denied. Treasurer role required.' });
    }

    const groupId = req.user.groupId;
    if (!groupId) {
      return res.status(400).json({ error: 'No group assigned to treasurer' });
    }

    // Get total dues count
    const totalDuesResult = await db.query(
      'SELECT COUNT(*) FROM dues WHERE created_by_user_id = $1',
      [req.user.userId]
    );

    // Get total amount collected
    const totalCollectedResult = await db.query(
      `SELECT COALESCE(SUM(pad.amount_allocated), 0) as total
       FROM payments p
       JOIN payment_allocations_dues pad ON p.id = pad.payment_id
       JOIN user_dues ud ON pad.user_due_id = ud.id
       JOIN dues d ON ud.due_id = d.id
       WHERE d.group_id = $1 AND p.status = 'verified'`,
      [groupId]
    );

    // Get pending verifications count
    const pendingVerificationsResult = await db.query(
      `SELECT COUNT(DISTINCT p.id) 
       FROM payments p
       JOIN payment_allocations_dues pad ON p.id = pad.payment_id
       JOIN user_dues ud ON pad.user_due_id = ud.id
       JOIN dues d ON ud.due_id = d.id
       WHERE d.group_id = $1 AND p.status = 'pending_verification'`,
      [groupId]
    );

    // Get active dues count
    const activeDuesResult = await db.query(
      `SELECT COUNT(*) 
       FROM dues 
       WHERE group_id = $1 AND due_date >= CURRENT_DATE`,
      [groupId]
    );

    // Get collection trend
    const collectionTrendResult = await db.query(
      `SELECT 
         TO_CHAR(DATE_TRUNC('month', p.created_at), 'Mon') as month,
         EXTRACT(MONTH FROM p.created_at) as month_num,
         COALESCE(SUM(pad.amount_allocated), 0) as total
       FROM payments p
       JOIN payment_allocations_dues pad ON p.id = pad.payment_id
       JOIN user_dues ud ON pad.user_due_id = ud.id
       JOIN dues d ON ud.due_id = d.id
       WHERE d.group_id = $1 
         AND p.status = 'verified'
         AND p.created_at >= NOW() - INTERVAL '6 months'
       GROUP BY DATE_TRUNC('month', p.created_at), EXTRACT(MONTH FROM p.created_at)
       ORDER BY month_num ASC`,
      [groupId]
    );

    // Get payment distribution
    const paymentDistributionResult = await db.query(
      `SELECT 
         p.method as category,
         COALESCE(SUM(pad.amount_allocated), 0) as amount
       FROM payments p
       JOIN payment_allocations_dues pad ON p.id = pad.payment_id
       JOIN user_dues ud ON pad.user_due_id = ud.id
       JOIN dues d ON ud.due_id = d.id
       WHERE d.group_id = $1 AND p.status = 'verified'
       GROUP BY p.method`,
      [groupId]
    );

    // Get recent payments
    const recentPaymentsResult = await db.query(
      `SELECT DISTINCT ON (p.id)
         p.id,
         CONCAT(u.first_name, ' ', u.last_name) as user_name,
         p.amount,
         d.title as due_title,
         p.created_at,
         p.status
       FROM payments p
       JOIN payment_allocations_dues pad ON p.id = pad.payment_id
       JOIN user_dues ud ON pad.user_due_id = ud.id
       JOIN dues d ON ud.due_id = d.id
       JOIN users u ON ud.user_id = u.id
       WHERE d.group_id = $1
       ORDER BY p.id, p.created_at DESC
       LIMIT 5`,
      [groupId]
    );

    res.json({
      total_dues: parseInt(totalDuesResult.rows[0].count),
      total_amount_collected: parseFloat(totalCollectedResult.rows[0].total),
      pending_verifications: parseInt(pendingVerificationsResult.rows[0].count),
      active_dues: parseInt(activeDuesResult.rows[0].count),
      collection_trend: {
        labels: collectionTrendResult.rows.map(row => row.month),
        data: collectionTrendResult.rows.map(row => parseFloat(row.total))
      },
      payment_distribution: paymentDistributionResult.rows.map(row => ({
        category: row.category,
        amount: parseFloat(row.amount)
      })),
      recent_payments: recentPaymentsResult.rows
    });
  } catch (error) {
    console.error('Get treasurer dashboard data error:', error);
    res.status(500).json({ error: 'Server error while fetching dashboard data' });
  }
};

/**
 * Get treasurer stats
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getStats = async (req, res) => {
  try {
    if (req.user.role !== 'treasurer') {
      return res.status(403).json({ error: 'Access denied. Treasurer role required.' });
    }

    const groupId = req.user.groupId;
    if (!groupId) {
      return res.status(400).json({ error: 'No group assigned to treasurer' });
    }

    // Get total dues
    const totalDuesResult = await db.query(
      'SELECT COUNT(*) FROM dues WHERE group_id = $1',
      [groupId]
    );

    // Get total students
    const totalStudentsResult = await db.query(
      'SELECT COUNT(*) FROM users WHERE group_id = $1 AND role = \'student\'',
      [groupId]
    );

    // Get total amount collected
    const totalCollectedResult = await db.query(
      `SELECT COALESCE(SUM(pad.amount_allocated), 0) as total
       FROM payments p
       JOIN payment_allocations_dues pad ON p.id = pad.payment_id
       JOIN user_dues ud ON pad.user_due_id = ud.id
       JOIN dues d ON ud.due_id = d.id
       WHERE d.group_id = $1 AND p.status = 'verified'`,
      [groupId]
    );

    // Get total amount pending
    const totalPendingResult = await db.query(
      `SELECT COALESCE(SUM(d.total_amount_due - COALESCE(ud.amount_paid, 0)), 0) as total
       FROM dues d
       JOIN user_dues ud ON d.id = ud.due_id
       WHERE d.group_id = $1 AND ud.status != 'paid'`,
      [groupId]
    );

    res.json({
      total_dues: parseInt(totalDuesResult.rows[0].count),
      total_students: parseInt(totalStudentsResult.rows[0].count),
      total_amount_collected: parseFloat(totalCollectedResult.rows[0].total),
      total_amount_pending: parseFloat(totalPendingResult.rows[0].total)
    });
  } catch (error) {
    console.error('Get treasurer stats error:', error);
    res.status(500).json({ error: 'Server error while fetching stats' });
  }
};

/**
 * Get all dues for the treasurer's group
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getDues = async (req, res) => {
  try {
    if (req.user.role !== 'treasurer') {
      return res.status(403).json({ error: 'Access denied. Treasurer role required.' });
    }

    const groupId = req.user.groupId;
    const limit = req.query.limit ? parseInt(req.query.limit) : null;

    let query = `
      SELECT 
        d.id,
        d.title,
        d.description,
        d.total_amount_due,
        d.due_date,
        d.created_at,
        (
          SELECT json_build_object(
            'pending', COUNT(*) FILTER (WHERE status = 'pending'),
            'partially_paid', COUNT(*) FILTER (WHERE status = 'partially_paid'),
            'paid', COUNT(*) FILTER (WHERE status = 'paid'),
            'overdue', COUNT(*) FILTER (WHERE status = 'overdue')
          )
          FROM user_dues
          WHERE due_id = d.id
        ) as status_summary
      FROM dues d
      WHERE d.group_id = $1
      ORDER BY d.created_at DESC
    `;

    if (limit) {
      query += ' LIMIT $2';
    }

    const values = limit ? [groupId, limit] : [groupId];
    const result = await db.query(query, values);

    res.json({
      dues: result.rows
    });
  } catch (error) {
    console.error('Get dues error:', error);
    res.status(500).json({ error: 'Server error while fetching dues' });
  }
};

/**
 * Create a new due and assign to all active students
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createDue = async (req, res) => {
  try {
    if (req.user.role !== 'treasurer') {
      return res.status(403).json({ error: 'Access denied. Treasurer role required.' });
    }

    const { title, description, total_amount_due, due_date } = req.body;
    const groupId = req.user.groupId;

    // Validate required fields
    if (!title || !total_amount_due || !due_date) {
      return res.status(400).json({ error: 'Title, amount, and due date are required' });
    }

    // Start transaction
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // Create the due
      const dueResult = await client.query(
        `INSERT INTO dues (
          created_by_user_id, group_id, title, description, 
          total_amount_due, due_date
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id`,
        [req.user.userId, groupId, title, description, total_amount_due, due_date]
      );

      const dueId = dueResult.rows[0].id;

      // Get all active users in the group
      const usersResult = await client.query(
        'SELECT id FROM users WHERE group_id = $1 AND is_active = true AND role = \'student\'',
        [groupId]
      );

      // Create user_dues records for each user
      for (const user of usersResult.rows) {
        await client.query(
          `INSERT INTO user_dues (due_id, user_id, status)
           VALUES ($1, $2, 'pending')`,
          [dueId, user.id]
        );
      }

      // Create a trigger function to automatically assign this due to new users
      await client.query(`
        CREATE OR REPLACE FUNCTION assign_dues_to_new_user()
        RETURNS TRIGGER AS $$
        BEGIN
          IF NEW.role = 'student' AND NEW.group_id IS NOT NULL THEN
            INSERT INTO user_dues (due_id, user_id, status)
            SELECT d.id, NEW.id, 'pending'
            FROM dues d
            WHERE d.group_id = NEW.group_id
              AND d.due_date >= CURRENT_DATE;
          END IF;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `);

      // Create the trigger if it doesn't exist
      await client.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 
            FROM pg_trigger 
            WHERE tgname = 'assign_dues_on_user_creation'
          ) THEN
            CREATE TRIGGER assign_dues_on_user_creation
            AFTER INSERT ON users
            FOR EACH ROW
            EXECUTE FUNCTION assign_dues_to_new_user();
          END IF;
        END;
        $$;
      `);

      await client.query('COMMIT');

      res.status(201).json({
        message: 'Due created successfully and assigned to all active students',
        due_id: dueId
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Create due error:', error);
    res.status(500).json({ error: 'Server error while creating due' });
  }
};

/**
 * Get detailed status of a specific due
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getDueStatus = async (req, res) => {
  try {
    if (req.user.role !== 'treasurer') {
      return res.status(403).json({ error: 'Access denied. Treasurer role required.' });
    }

    const { dueId } = req.params;
    const groupId = req.user.groupId;

    // Get due details and user statuses
    const result = await db.query(
      `SELECT 
         d.id, d.title, d.description, d.total_amount_due, d.due_date,
         u.id as user_id,
         CONCAT(u.first_name, ' ', u.last_name) as user_name,
         ud.status,
         ud.amount_paid,
         ud.last_payment_date
       FROM dues d
       JOIN user_dues ud ON d.id = ud.due_id
       JOIN users u ON ud.user_id = u.id
       WHERE d.id = $1 AND d.group_id = $2
       ORDER BY u.last_name, u.first_name`,
      [dueId, groupId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Due not found' });
    }

    // Restructure the data
    const dueDetails = {
      id: result.rows[0].id,
      title: result.rows[0].title,
      description: result.rows[0].description,
      total_amount_due: result.rows[0].total_amount_due,
      due_date: result.rows[0].due_date,
      user_statuses: result.rows.map(row => ({
        user_id: row.user_id,
        user_name: row.user_name,
        status: row.status,
        amount_paid: row.amount_paid,
        last_payment_date: row.last_payment_date
      }))
    };

    res.json(dueDetails);
  } catch (error) {
    console.error('Get due status error:', error);
    res.status(500).json({ error: 'Server error while fetching due status' });
  }
};

/**
 * Export due status to CSV
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const exportDueStatus = async (req, res) => {
  try {
    if (req.user.role !== 'treasurer') {
      return res.status(403).json({ error: 'Access denied. Treasurer role required.' });
    }

    const { dueId } = req.params;
    const groupId = req.user.groupId;

    const result = await db.query(
      `SELECT 
         d.title as due_title,
         u.first_name,
         u.last_name,
         ud.status,
         ud.amount_paid,
         d.total_amount_due,
         ud.last_payment_date
       FROM dues d
       JOIN user_dues ud ON d.id = ud.due_id
       JOIN users u ON ud.user_id = u.id
       WHERE d.id = $1 AND d.group_id = $2
       ORDER BY u.last_name, u.first_name`,
      [dueId, groupId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Due not found' });
    }

    // Generate CSV content
    const csvHeader = 'Last Name,First Name,Status,Amount Paid,Total Amount Due,Last Payment Date\n';
    const csvRows = result.rows.map(row => 
      `${row.last_name},${row.first_name},${row.status},${row.amount_paid},${row.total_amount_due},${row.last_payment_date || ''}`
    ).join('\n');
    const csvContent = csvHeader + csvRows;

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${result.rows[0].due_title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_status.csv`);

    res.send(csvContent);
  } catch (error) {
    console.error('Export due status error:', error);
    res.status(500).json({ error: 'Server error while exporting due status' });
  }
};

/**
 * Get pending payments
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getPendingPayments = async (req, res) => {
  try {
    if (req.user.role !== 'treasurer') {
      return res.status(403).json({ error: 'Access denied. Treasurer role required.' });
    }

    const groupId = req.user.groupId;
    const result = await db.query(
      `SELECT DISTINCT ON (p.id)
         p.id,
         CONCAT(u.first_name, ' ', u.last_name) as user_name,
         p.amount,
         d.title as due_title,
         p.created_at,
         p.method,
         p.reference_id,
         p.receipt_url
       FROM payments p
       JOIN payment_allocations_dues pad ON p.id = pad.payment_id
       JOIN user_dues ud ON pad.user_due_id = ud.id
       JOIN dues d ON ud.due_id = d.id
       JOIN users u ON p.user_id = u.id
       WHERE d.group_id = $1 AND p.status = 'pending_verification'
       ORDER BY p.id, p.created_at DESC`,
      [groupId]
    );

    res.json({
      payments: result.rows
    });
  } catch (error) {
    console.error('Get pending payments error:', error);
    res.status(500).json({ error: 'Server error while fetching pending payments' });
  }
};

/**
 * Verify a payment
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const verifyPayment = async (req, res) => {
  const client = await db.connect();
  try {
    if (req.user.role !== 'treasurer') {
      return res.status(403).json({ error: 'Access denied. Treasurer role required.' });
    }

    const { paymentId } = req.params;
    const groupId = req.user.groupId;

    await client.query('BEGIN');

    // Verify payment belongs to treasurer's group
    const paymentResult = await client.query(
      `SELECT p.*, ud.id as user_due_id, ud.amount_paid, d.total_amount_due
       FROM payments p
       JOIN payment_allocations_dues pad ON p.id = pad.payment_id
       JOIN user_dues ud ON pad.user_due_id = ud.id
       JOIN dues d ON ud.due_id = d.id
       WHERE p.id = $1 AND d.group_id = $2 AND p.status = 'pending_verification'`,
      [paymentId, groupId]
    );

    if (paymentResult.rows.length === 0) {
      throw new Error('Payment not found or already verified');
    }

    const payment = paymentResult.rows[0];

    // Update payment status
    await client.query(
      `UPDATE payments 
       SET status = 'verified', 
           verified_at = NOW(),
           verified_by_user_id = $1
       WHERE id = $2`,
      [req.user.userId, paymentId]
    );

    // Get all payment allocations
    const allocationsResult = await client.query(
      `SELECT pad.*, ud.amount_paid, d.total_amount_due
       FROM payment_allocations_dues pad
       JOIN user_dues ud ON pad.user_due_id = ud.id
       JOIN dues d ON ud.due_id = d.id
       WHERE pad.payment_id = $1`,
      [paymentId]
    );

    // Update user_dues for each allocation
    for (const allocation of allocationsResult.rows) {
      const newAmountPaid = parseFloat(allocation.amount_paid) + parseFloat(allocation.amount_allocated);
      const totalAmountDue = parseFloat(allocation.total_amount_due);

      await client.query(
        `UPDATE user_dues 
         SET amount_paid = $1,
             status = $2,
             last_payment_date = NOW()
         WHERE id = $3`,
        [
          newAmountPaid,
          newAmountPaid >= totalAmountDue ? 'paid' : 'partially_paid',
          allocation.user_due_id
        ]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Payment verified successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Verify payment error:', error);
    res.status(500).json({ error: 'Server error while verifying payment' });
  } finally {
    client.release();
  }
};

/**
 * Reject a payment
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const rejectPayment = async (req, res) => {
  try {
    if (req.user.role !== 'treasurer') {
      return res.status(403).json({ error: 'Access denied. Treasurer role required.' });
    }

    const { paymentId } = req.params;
    const groupId = req.user.groupId;

    // Verify payment belongs to treasurer's group
    const result = await db.query(
      `UPDATE payments p
       SET status = 'rejected',
           verified_at = NOW(),
           verified_by_user_id = $1
       FROM user_dues ud
       JOIN dues d ON ud.due_id = d.id
       WHERE p.id = $2 
         AND p.user_due_id = ud.id
         AND d.group_id = $3 
         AND p.status = 'pending_verification'
       RETURNING p.id`,
      [req.user.userId, paymentId, groupId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found or already processed' });
    }

    res.json({ message: 'Payment rejected successfully' });
  } catch (error) {
    console.error('Reject payment error:', error);
    res.status(500).json({ error: 'Server error while rejecting payment' });
  }
};

/**
 * Export payments
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const exportPayments = async (req, res) => {
  try {
    if (req.user.role !== 'treasurer') {
      return res.status(403).json({ error: 'Access denied. Treasurer role required.' });
    }

    const groupId = req.user.groupId;
    const { dateRange, status } = req.query;

    let dateFilter = '';
    switch (dateRange) {
      case 'this_month':
        dateFilter = 'AND DATE_TRUNC(\'month\', p.created_at) = DATE_TRUNC(\'month\', CURRENT_DATE)';
        break;
      case 'last_month':
        dateFilter = 'AND DATE_TRUNC(\'month\', p.created_at) = DATE_TRUNC(\'month\', CURRENT_DATE - INTERVAL \'1 month\')';
        break;
      case 'this_year':
        dateFilter = 'AND DATE_TRUNC(\'year\', p.created_at) = DATE_TRUNC(\'year\', CURRENT_DATE)';
        break;
      default:
        dateFilter = '';
    }

    let statusFilter = status && status !== 'all' ? `AND p.status = '${status}'` : '';

    const result = await db.query(
      `SELECT 
         CONCAT(u.last_name, ', ', u.first_name) as student_name,
         d.title as due_title,
         p.amount,
         p.method,
         p.reference_id,
         p.status,
         p.created_at,
         CASE 
           WHEN p.verified_at IS NOT NULL 
           THEN CONCAT(v.first_name, ' ', v.last_name)
           ELSE NULL
         END as verified_by,
         p.verified_at
       FROM payments p
       JOIN user_dues ud ON p.user_due_id = ud.id
       JOIN dues d ON ud.due_id = d.id
       JOIN users u ON ud.user_id = u.id
       LEFT JOIN users v ON p.verified_by_user_id = v.id
       WHERE d.group_id = $1 ${dateFilter} ${statusFilter}
       ORDER BY p.created_at DESC`,
      [groupId]
    );

    // Generate CSV content
    const csvHeader = 'Student Name,Due Title,Amount,Method,Reference ID,Status,Created At,Verified By,Verified At\n';
    const csvRows = result.rows.map(row => 
      `${row.student_name},${row.due_title},${row.amount},${row.method},${row.reference_id || ''},${row.status},${row.created_at},${row.verified_by || ''},${row.verified_at || ''}`
    ).join('\n');
    const csvContent = csvHeader + csvRows;

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=payments_${dateRange || 'all'}_${status || 'all'}.csv`);

    res.send(csvContent);
  } catch (error) {
    console.error('Export payments error:', error);
    res.status(500).json({ error: 'Server error while exporting payments' });
  }
};

/**
 * Export summary report
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const exportSummaryReport = async (req, res) => {
  try {
    if (req.user.role !== 'treasurer') {
      return res.status(403).json({ error: 'Access denied. Treasurer role required.' });
    }

    const groupId = req.user.groupId;
    const { type } = req.query;

    let query = '';
    let filename = '';

    switch (type) {
      case 'collection':
        query = `
          SELECT 
            d.title as due_title,
            COUNT(DISTINCT ud.user_id) as total_students,
            COUNT(DISTINCT CASE WHEN ud.status = 'paid' THEN ud.user_id END) as paid_students,
            COUNT(DISTINCT CASE WHEN ud.status = 'partially_paid' THEN ud.user_id END) as partial_students,
            COUNT(DISTINCT CASE WHEN ud.status IN ('pending', 'overdue') THEN ud.user_id END) as unpaid_students,
            SUM(CASE WHEN p.status = 'verified' THEN p.amount ELSE 0 END) as total_collected,
            SUM(d.total_amount_due) as total_expected
          FROM dues d
          LEFT JOIN user_dues ud ON d.id = ud.due_id
          LEFT JOIN payments p ON ud.id = p.user_due_id AND p.status = 'verified'
          WHERE d.group_id = $1
          GROUP BY d.id, d.title
          ORDER BY d.created_at DESC
        `;
        filename = 'collection_summary.csv';
        break;

      case 'student':
        query = `
          SELECT 
            CONCAT(u.last_name, ', ', u.first_name) as student_name,
            COUNT(DISTINCT ud.due_id) as total_dues,
            COUNT(DISTINCT CASE WHEN ud.status = 'paid' THEN ud.due_id END) as paid_dues,
            COUNT(DISTINCT CASE WHEN ud.status = 'partially_paid' THEN ud.due_id END) as partial_dues,
            COUNT(DISTINCT CASE WHEN ud.status IN ('pending', 'overdue') THEN ud.due_id END) as unpaid_dues,
            SUM(CASE WHEN p.status = 'verified' THEN p.amount ELSE 0 END) as total_paid,
            SUM(d.total_amount_due) as total_due
          FROM users u
          LEFT JOIN user_dues ud ON u.id = ud.user_id
          LEFT JOIN dues d ON ud.due_id = d.id
          LEFT JOIN payments p ON ud.id = p.user_due_id AND p.status = 'verified'
          WHERE u.group_id = $1 AND u.role = 'student'
          GROUP BY u.id, u.last_name, u.first_name
          ORDER BY u.last_name, u.first_name
        `;
        filename = 'student_summary.csv';
        break;

      default:
        query = `
          SELECT 
            d.title as due_title,
            d.total_amount_due,
            COUNT(DISTINCT ud.user_id) as total_students,
            SUM(CASE WHEN p.status = 'verified' THEN p.amount ELSE 0 END) as amount_collected,
            COUNT(DISTINCT CASE WHEN p.status = 'verified' THEN p.id END) as total_payments,
            MIN(p.created_at) as first_payment,
            MAX(p.created_at) as last_payment
          FROM dues d
          LEFT JOIN user_dues ud ON d.id = ud.due_id
          LEFT JOIN payments p ON ud.id = p.user_due_id AND p.status = 'verified'
          WHERE d.group_id = $1
          GROUP BY d.id, d.title, d.total_amount_due
          ORDER BY d.created_at DESC
        `;
        filename = 'due_summary.csv';
    }

    const result = await db.query(query, [groupId]);

    // Generate CSV content
    const csvHeader = Object.keys(result.rows[0]).join(',') + '\n';
    const csvRows = result.rows.map(row => 
      Object.values(row).map(val => val === null ? '' : val).join(',')
    ).join('\n');
    const csvContent = csvHeader + csvRows;

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

    res.send(csvContent);
  } catch (error) {
    console.error('Export summary report error:', error);
    res.status(500).json({ error: 'Server error while exporting summary report' });
  }
};

/**
 * Export student list
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const exportStudentList = async (req, res) => {
  try {
    if (req.user.role !== 'treasurer') {
      return res.status(403).json({ error: 'Access denied. Treasurer role required.' });
    }

    const groupId = req.user.groupId;
    const details = req.query.details ? req.query.details.split(',') : [];

    let query = `
      SELECT 
        CONCAT(u.last_name, ', ', u.first_name) as student_name,
        u.email
    `;

    if (details.includes('payment_history')) {
      query += `,
        COUNT(DISTINCT p.id) as total_payments,
        SUM(CASE WHEN p.status = 'verified' THEN p.amount ELSE 0 END) as total_paid
      `;
    }

    if (details.includes('current_balance')) {
      query += `,
        SUM(d.total_amount_due) as total_due,
        SUM(CASE WHEN p.status = 'verified' THEN p.amount ELSE 0 END) as amount_paid,
        SUM(d.total_amount_due) - SUM(CASE WHEN p.status = 'verified' THEN p.amount ELSE 0 END) as balance
      `;
    }

    if (details.includes('contact_info')) {
      query += `,
        u.contact_number,
        u.address
      `;
    }

    query += `
      FROM users u
      LEFT JOIN user_dues ud ON u.id = ud.user_id
      LEFT JOIN dues d ON ud.due_id = d.id
      LEFT JOIN payments p ON ud.id = p.user_due_id AND p.status = 'verified'
      WHERE u.group_id = $1 AND u.role = 'student'
      GROUP BY u.id, u.last_name, u.first_name, u.email
      ${details.includes('contact_info') ? ', u.contact_number, u.address' : ''}
      ORDER BY u.last_name, u.first_name
    `;

    const result = await db.query(query, [groupId]);

    // Generate CSV content
    const csvHeader = Object.keys(result.rows[0]).join(',') + '\n';
    const csvRows = result.rows.map(row => 
      Object.values(row).map(val => val === null ? '' : val).join(',')
    ).join('\n');
    const csvContent = csvHeader + csvRows;

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=student_list.csv');

    res.send(csvContent);
  } catch (error) {
    console.error('Export student list error:', error);
    res.status(500).json({ error: 'Server error while exporting student list' });
  }
};

/**
 * Get treasurer profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getProfile = async (req, res) => {
  try {
    if (req.user.role !== 'treasurer') {
      return res.status(403).json({ error: 'Access denied. Treasurer role required.' });
    }

    const result = await db.query(
      `SELECT 
         u.id,
         u.first_name,
         u.middle_name,
         u.last_name,
         u.suffix,
         u.email,
         g.name as group_name,
         g.id as group_id
       FROM users u
       LEFT JOIN groups g ON u.group_id = g.id
       WHERE u.id = $1`,
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get treasurer profile error:', error);
    res.status(500).json({ error: 'Server error while fetching profile' });
  }
};

/**
 * Update treasurer profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateProfile = async (req, res) => {
  try {
    if (req.user.role !== 'treasurer') {
      return res.status(403).json({ error: 'Access denied. Treasurer role required.' });
    }

    const { first_name, middle_name, last_name, suffix } = req.body;

    // Validate required fields
    if (!first_name || !last_name) {
      return res.status(400).json({ error: 'First name and last name are required' });
    }

    const result = await db.query(
      `UPDATE users 
       SET first_name = $1,
           middle_name = $2,
           last_name = $3,
           suffix = $4
       WHERE id = $5
       RETURNING id, first_name, middle_name, last_name, suffix, email`,
      [first_name, middle_name || null, last_name, suffix || null, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update treasurer profile error:', error);
    res.status(500).json({ error: 'Server error while updating profile' });
  }
};

/**
 * Get treasurer's group details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getGroupDetails = async (req, res) => {
  try {
    if (req.user.role !== 'treasurer') {
      return res.status(403).json({ error: 'Access denied. Treasurer role required.' });
    }

    const groupId = req.user.groupId;
    if (!groupId) {
      return res.status(400).json({ error: 'No group assigned to treasurer' });
    }

    const result = await db.query(
      `SELECT 
         g.id,
         g.name,
         g.description,
         (SELECT COUNT(*) FROM users WHERE group_id = g.id AND role = 'student') as total_students,
         (SELECT COUNT(*) FROM dues WHERE group_id = g.id) as total_dues,
         COALESCE(
           (SELECT SUM(pad.amount_allocated)
            FROM payments p
            JOIN payment_allocations_dues pad ON p.id = pad.payment_id
            JOIN user_dues ud ON pad.user_due_id = ud.id
            JOIN dues d ON ud.due_id = d.id
            WHERE d.group_id = g.id AND p.status = 'verified'),
           0
         ) as total_collected
       FROM groups g
       WHERE g.id = $1`,
      [groupId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get group details error:', error);
    res.status(500).json({ error: 'Server error while fetching group details' });
  }
};

/**
 * Delete a due (and all related user_dues and payment_allocations_dues)
 * Only the treasurer of the group can delete dues for their group
 */
const deleteDue = async (req, res) => {
  try {
    if (req.user.role !== 'treasurer') {
      return res.status(403).json({ error: 'Access denied. Treasurer role required.' });
    }
    const groupId = req.user.groupId;
    const dueId = req.params.dueId;
    // Check if due exists and belongs to this group
    const dueResult = await db.query('SELECT id FROM dues WHERE id = $1 AND group_id = $2', [dueId, groupId]);
    if (dueResult.rows.length === 0) {
      return res.status(404).json({ error: 'Due not found or does not belong to your group' });
    }
    // Start transaction
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      // Delete payment_allocations_dues for this due
      await client.query(`
        DELETE FROM payment_allocations_dues
        WHERE user_due_id IN (SELECT id FROM user_dues WHERE due_id = $1)
      `, [dueId]);
      // Delete user_dues for this due
      await client.query('DELETE FROM user_dues WHERE due_id = $1', [dueId]);
      // Delete the due itself
      await client.query('DELETE FROM dues WHERE id = $1', [dueId]);
      await client.query('COMMIT');
      res.json({ success: true, message: 'Due deleted successfully' });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Delete due error:', error);
    res.status(500).json({ error: 'Server error while deleting due' });
  }
};

module.exports = {
  getDashboardData,
  getStats,
  getDues,
  createDue,
  getDueStatus,
  exportDueStatus,
  getPendingPayments,
  verifyPayment,
  rejectPayment,
  exportPayments,
  exportSummaryReport,
  exportStudentList,
  getProfile,
  updateProfile,
  getGroupDetails,
  deleteDue
}; 