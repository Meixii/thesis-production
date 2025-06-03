const db = require('../config/db');
const notificationService = require('../services/notificationService');

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
      total_amount_collected: parseFloat(totalCollectedResult.rows[0].total) || 0,
      pending_verifications: parseInt(pendingVerificationsResult.rows[0].count),
      active_dues: parseInt(activeDuesResult.rows[0].count),
      collection_trend: {
        labels: collectionTrendResult.rows.map(row => row.month),
        data: collectionTrendResult.rows.map(row => parseFloat(row.total) || 0)
      },
      payment_distribution: paymentDistributionResult.rows.map(row => ({
        category: row.category,
        amount: parseFloat(row.amount) || 0
      })),
      recent_payments: recentPaymentsResult.rows.map(row => ({
        ...row,
        amount: parseFloat(row.amount) || 0
      }))
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
      'SELECT COUNT(*) FROM users WHERE group_id = $1 AND role IN (\'student\', \'finance_coordinator\')',
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
      total_amount_collected: parseFloat(totalCollectedResult.rows[0].total) || 0,
      total_amount_pending: parseFloat(totalPendingResult.rows[0].total) || 0
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

    // Update all due statuses before returning results
    await updateAllDueStatuses(groupId);

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
        'SELECT id FROM users WHERE group_id = $1 AND is_active = true AND role IN (\'student\', \'finance_coordinator\')',
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
          IF NEW.role IN ('student', 'finance_coordinator') AND NEW.group_id IS NOT NULL THEN
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

      // Send notification to all group members
      try {
        const creatorName = `${req.user.firstName} ${req.user.lastName}`;
        await notificationService.notifyNewDue({
          dueId,
          title,
          amount: parseFloat(total_amount_due),
          dueDate: due_date,
          groupId,
          creatorName
        });
      } catch (notificationError) {
        console.error('Failed to send notifications:', notificationError);
        // Don't fail the request if notifications fail
      }

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

    // Update the statuses for this due
    await updateDueStatuses(dueId);

    // Get due details and user statuses
    const result = await db.query(
      `SELECT 
         d.id, d.title, d.description, d.total_amount_due, d.due_date,
         u.id as user_id,
         CONCAT(u.first_name, ' ', u.last_name) as user_name,
         ud.id as user_due_id,
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

    // For each user_due, fetch payment history
    const userStatuses = await Promise.all(result.rows.map(async row => {
      const paymentsResult = await db.query(
        `SELECT p.id, p.amount, p.method, p.status, p.reference_id, p.receipt_url, p.created_at, p.verified_at, pad.amount_allocated
         FROM payments p
         JOIN payment_allocations_dues pad ON pad.payment_id = p.id
         WHERE pad.user_due_id = $1 AND p.user_id = $2
         ORDER BY p.created_at DESC`,
        [row.user_due_id, row.user_id]
      );
      return {
        user_id: row.user_id,
        user_name: row.user_name,
        status: row.status,
        amount_paid: parseFloat(row.amount_paid) || 0,
        last_payment_date: row.last_payment_date,
        payments: paymentsResult.rows.map(p => ({
          id: p.id,
          amount: parseFloat(p.amount) || 0,
          method: p.method,
          status: p.status,
          reference_id: p.reference_id,
          receipt_url: p.receipt_url,
          created_at: p.created_at,
          verified_at: p.verified_at,
          amount_allocated: parseFloat(p.amount_allocated) || 0
        }))
      };
    }));

    // Restructure the data
    const dueDetails = {
      id: result.rows[0].id,
      title: result.rows[0].title,
      description: result.rows[0].description,
      total_amount_due: parseFloat(result.rows[0].total_amount_due) || 0,
      due_date: result.rows[0].due_date,
      user_statuses: userStatuses
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
         ud.last_payment_date,
         (
           SELECT p.reference_id
           FROM payments p
           JOIN payment_allocations_dues pad ON p.id = pad.payment_id
           WHERE pad.user_due_id = ud.id AND p.status = 'verified'
           ORDER BY p.created_at DESC
           LIMIT 1
         ) as reference_id,
         (
           SELECT p.method
           FROM payments p
           JOIN payment_allocations_dues pad ON p.id = pad.payment_id
           WHERE pad.user_due_id = ud.id AND p.status = 'verified'
           ORDER BY p.created_at DESC
           LIMIT 1
         ) as payment_method
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

    // Format date function
    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12;
      const formattedMinutes = minutes.toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const year = date.getFullYear();
      
      return `${formattedHours}:${formattedMinutes}${ampm} ${month}/${day}/${year}`;
    };

    // Calculate totals
    let totalPaid = 0;
    let totalGcash = 0;
    let totalCash = 0;
    let totalMaya = 0;
    let totalOthers = 0;

    result.rows.forEach(row => {
      const amountPaid = parseFloat(row.amount_paid) || 0;
      totalPaid += amountPaid;
      
      if (row.payment_method === 'gcash') {
        totalGcash += amountPaid;
      } else if (row.payment_method === 'cash') {
        totalCash += amountPaid;
      } else if (row.payment_method === 'maya') {
        totalMaya += amountPaid;
      } else if (row.payment_method && amountPaid > 0) {
        totalOthers += amountPaid;
      }
    });

    // Generate CSV content
    const csvHeader = 'Last Name,First Name,Status,Amount Paid,Total Amount Due,Last Payment Date,Ref ID,Payment Method\n';
    const csvRows = result.rows.map(row => 
      `${row.last_name},${row.first_name},${row.status},${row.amount_paid},${row.total_amount_due},${formatDate(row.last_payment_date)},${row.reference_id || ''},${row.payment_method || ''}`
    ).join('\n');
    
    // Add summary rows
    const summaryRows = [
      '\n\nSummary,,,,,,,,',
      `Total Paid,,,${totalPaid.toFixed(2)},,,,`,
      `Total GCash,,,${totalGcash.toFixed(2)},,,,`,
      `Total Cash,,,${totalCash.toFixed(2)},,,,`,
      `Total Maya,,,${totalMaya.toFixed(2)},,,,`,
      `Total Others,,,${totalOthers.toFixed(2)},,,,`
    ].join('\n');
    
    const csvContent = csvHeader + csvRows + summaryRows;

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
      payments: result.rows.map(row => ({
        ...row,
        amount: parseFloat(row.amount) || 0
      }))
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
    
    // Send verification notification
    try {
      // Get user and payment details for notification
      const userResult = await db.query(
        `SELECT u.id, u.email, u.first_name, p.amount, p.method, d.title
         FROM payments p
         JOIN users u ON p.user_id = u.id
         JOIN payment_allocations_dues pad ON p.id = pad.payment_id
         JOIN user_dues ud ON pad.user_due_id = ud.id
         JOIN dues d ON ud.due_id = d.id
         WHERE p.id = $1`,
        [paymentId]
      );
      
      if (userResult.rows.length > 0) {
        const userData = userResult.rows[0];
        await notificationService.notifyPaymentVerified({
          userId: userData.id,
          userEmail: userData.email,
          userName: userData.first_name,
          amount: parseFloat(userData.amount),
          dueTitle: userData.title,
          paymentMethod: userData.method,
          paymentId: paymentId
        });
      }
    } catch (notificationError) {
      console.error('Failed to send verification notification:', notificationError);
    }
    
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
  const client = await db.connect();
  try {
    if (req.user.role !== 'treasurer') {
      return res.status(403).json({ error: 'Access denied. Treasurer role required.' });
    }

    const { paymentId } = req.params;
    const { reason = 'Payment information does not match our records' } = req.body;
    const groupId = req.user.groupId;

    await client.query('BEGIN');

    // Get payment details before updating
    const paymentDetailsResult = await client.query(
      `SELECT p.*, u.id as user_id, u.email, u.first_name, d.title
       FROM payments p
       JOIN users u ON p.user_id = u.id
       JOIN payment_allocations_dues pad ON p.id = pad.payment_id
       JOIN user_dues ud ON pad.user_due_id = ud.id
       JOIN dues d ON ud.due_id = d.id
       WHERE p.id = $1 AND d.group_id = $2 AND p.status = 'pending_verification'`,
      [paymentId, groupId]
    );

    if (paymentDetailsResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Payment not found or already processed' });
    }

    const paymentDetails = paymentDetailsResult.rows[0];

    // Update payment status
    await client.query(
      `UPDATE payments 
       SET status = 'rejected',
           verified_at = NOW(),
           verified_by_user_id = $1
       WHERE id = $2`,
      [req.user.userId, paymentId]
    );

    await client.query('COMMIT');
    
    // Send rejection notification
    try {
      await notificationService.notifyPaymentRejected({
        userId: paymentDetails.user_id,
        userEmail: paymentDetails.email,
        userName: paymentDetails.first_name,
        amount: parseFloat(paymentDetails.amount),
        dueTitle: paymentDetails.title,
        rejectionReason: reason,
        paymentId: paymentId
      });
    } catch (notificationError) {
      console.error('Failed to send rejection notification:', notificationError);
    }
    
    res.json({ message: 'Payment rejected successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Reject payment error:', error);
    res.status(500).json({ error: 'Server error while rejecting payment' });
  } finally {
    client.release();
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
          WHERE u.group_id = $1 AND u.role IN ('student', 'finance_coordinator')
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
      WHERE u.group_id = $1 AND u.role IN ('student', 'finance_coordinator')
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
         g.group_name,
         g.description,
         (SELECT COUNT(*) FROM users WHERE group_id = g.id AND role IN ('student', 'finance_coordinator')) as total_students,
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

/**
 * Get all members (students and FCs) in the Treasurer's group
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getMembers = async (req, res) => {
  try {
    if (req.user.role !== 'treasurer') {
      return res.status(403).json({ error: 'Access denied. Treasurer role required.' });
    }
    const groupId = req.user.groupId;
    if (!groupId) {
      return res.status(400).json({ error: 'No group assigned to treasurer' });
    }
    const result = await db.query(
      `SELECT id, first_name, last_name, email, role
       FROM users
       WHERE group_id = $1 AND role IN ('student', 'finance_coordinator')
       ORDER BY last_name, first_name`,
      [groupId]
    );
    res.json({ members: result.rows });
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({ error: 'Server error while fetching members' });
  }
};

/**
 * Update due date for a specific due
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateDueDate = async (req, res) => {
  try {
    if (req.user.role !== 'treasurer') {
      return res.status(403).json({ error: 'Access denied. Treasurer role required.' });
    }

    const { dueId } = req.params;
    const { due_date } = req.body;
    const groupId = req.user.groupId;

    // Validate required fields
    if (!due_date) {
      return res.status(400).json({ error: 'Due date is required' });
    }

    // Update the due date
    const result = await db.query(
      `UPDATE dues 
       SET due_date = $1
       WHERE id = $2 AND group_id = $3
       RETURNING id, title, due_date`,
      [due_date, dueId, groupId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Due not found' });
    }

    // Check for overdue payments and update statuses
    await updateDueStatuses(dueId);

    res.json({
      message: 'Due date updated successfully',
      due: result.rows[0]
    });
  } catch (error) {
    console.error('Update due date error:', error);
    res.status(500).json({ error: 'Server error while updating due date' });
  }
};

/**
 * Helper function to update due statuses, especially for overdue items
 * @param {number} dueId - The ID of the due to update statuses for
 */
const updateDueStatuses = async (dueId) => {
  try {
    // Get the due details
    const dueResult = await db.query(
      `SELECT id, due_date, total_amount_due FROM dues WHERE id = $1`,
      [dueId]
    );
    
    if (dueResult.rows.length === 0) return;
    
    const due = dueResult.rows[0];
    const currentDate = new Date();
    const dueDate = new Date(due.due_date);
    
    // If due date has passed, mark only PENDING dues as overdue (not partially_paid)
    if (dueDate < currentDate) {
      await db.query(
        `UPDATE user_dues 
         SET status = 'overdue' 
         WHERE due_id = $1 AND status = 'pending' 
         AND amount_paid = 0`,
        [dueId]
      );
    } else {
      // If due date is in the future, revert overdue status to pending
      // (partially_paid should never have been overdue in the first place)
      await db.query(
        `UPDATE user_dues 
         SET status = 'pending' 
         WHERE due_id = $1 AND status = 'overdue'`,
        [dueId]
      );
    }
  } catch (error) {
    console.error('Update due statuses error:', error);
  }
};

/**
 * Update statuses for all dues in the system
 * This is especially useful when loading the dues list to ensure overdue status is updated
 * @param {number} groupId - The group ID to update dues for
 */
const updateAllDueStatuses = async (groupId) => {
  try {
    // Get all dues for this group
    const duesResult = await db.query(
      `SELECT id FROM dues WHERE group_id = $1`,
      [groupId]
    );
    
    // Update statuses for each due
    for (const due of duesResult.rows) {
      await updateDueStatuses(due.id);
    }
  } catch (error) {
    console.error('Update all due statuses error:', error);
  }
};

/**
 * Get all checklists for the treasurer's group
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getChecklists = async (req, res) => {
  try {
    if (req.user.role !== 'treasurer') {
      return res.status(403).json({ error: 'Access denied. Treasurer role required.' });
    }

    const groupId = req.user.groupId;
    
    const result = await db.query(
      `SELECT 
         c.id, 
         c.title, 
         c.description, 
         c.due_date, 
         c.created_at,
         COUNT(ci.id) as total_items,
         COUNT(CASE WHEN ci.status = 'completed' THEN 1 END) as completed_items,
         json_agg(json_build_object(
           'id', ci.id,
           'title', ci.title, 
           'description', ci.description,
           'status', ci.status
         )) as items
       FROM checklists c
       LEFT JOIN checklist_items ci ON c.id = ci.checklist_id
       WHERE c.group_id = $1
       GROUP BY c.id
       ORDER BY c.created_at DESC`,
      [groupId]
    );

    res.json({
      checklists: result.rows.map(row => ({
        ...row,
        items: row.items[0].id ? row.items : [] // Handle case where no items exist
      }))
    });
  } catch (error) {
    console.error('Get checklists error:', error);
    res.status(500).json({ error: 'Server error while fetching checklists' });
  }
};

/**
 * Create a new checklist
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createChecklist = async (req, res) => {
  try {
    if (req.user.role !== 'treasurer') {
      return res.status(403).json({ error: 'Access denied. Treasurer role required.' });
    }

    const { title, description, due_date, items } = req.body;
    const groupId = req.user.groupId;

    // Validate required fields
    if (!title || !due_date) {
      return res.status(400).json({ error: 'Title and due date are required' });
    }

    // Start transaction
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // Create the checklist
      const checklistResult = await client.query(
        `INSERT INTO checklists (
          created_by_user_id, group_id, title, description, due_date
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING id`,
        [req.user.userId, groupId, title, description, due_date]
      );

      const checklistId = checklistResult.rows[0].id;

      // Create checklist items if provided
      if (items && items.length > 0) {
        for (const item of items) {
          await client.query(
            `INSERT INTO checklist_items (
              checklist_id, title, description, status
            ) VALUES ($1, $2, $3, 'pending')`,
            [checklistId, item.title, item.description]
          );
        }
      }

      await client.query('COMMIT');

      res.status(201).json({
        message: 'Checklist created successfully',
        checklist_id: checklistId
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Create checklist error:', error);
    res.status(500).json({ error: 'Server error while creating checklist' });
  }
};

/**
 * Get detailed checklist with student statuses
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getChecklistStatus = async (req, res) => {
  try {
    if (req.user.role !== 'treasurer') {
      return res.status(403).json({ error: 'Access denied. Treasurer role required.' });
    }

    const { checklistId } = req.params;
    const groupId = req.user.groupId;

    // Verify the checklist belongs to the treasurer's group
    const checklistResult = await db.query(
      `SELECT id, title, description, due_date 
       FROM checklists 
       WHERE id = $1 AND group_id = $2`,
      [checklistId, groupId]
    );

    if (checklistResult.rows.length === 0) {
      return res.status(404).json({ error: 'Checklist not found' });
    }

    const checklist = checklistResult.rows[0];

    // Get checklist items
    const itemsResult = await db.query(
      `SELECT id, title, description, status
       FROM checklist_items
       WHERE checklist_id = $1
       ORDER BY id`,
      [checklistId]
    );

    // Get all students in the group
    const studentsResult = await db.query(
      `SELECT id, first_name, last_name
       FROM users
       WHERE group_id = $1 AND role IN ('student', 'finance_coordinator')
       ORDER BY last_name, first_name`,
      [groupId]
    );

    // Get student completion status for each item
    const statusResult = await db.query(
      `SELECT cs.user_id, cs.checklist_item_id, cs.status
       FROM checklist_student_status cs
       JOIN checklist_items ci ON cs.checklist_item_id = ci.id
       WHERE ci.checklist_id = $1`,
      [checklistId]
    );

    // Build the response
    const studentStatuses = studentsResult.rows.map(student => {
      const itemStatuses = itemsResult.rows.map(item => {
        const studentStatus = statusResult.rows.find(
          status => status.user_id === student.id && status.checklist_item_id === item.id
        );
        return {
          item_id: item.id,
          status: studentStatus ? studentStatus.status : 'pending'
        };
      });

      return {
        user_id: student.id,
        user_name: `${student.first_name} ${student.last_name}`,
        item_statuses: itemStatuses
      };
    });

    res.json({
      checklist: {
        id: checklist.id,
        title: checklist.title,
        description: checklist.description,
        due_date: checklist.due_date,
        items: itemsResult.rows,
        student_statuses: studentStatuses
      }
    });
  } catch (error) {
    console.error('Get checklist status error:', error);
    res.status(500).json({ error: 'Server error while fetching checklist status' });
  }
};

/**
 * Add a new item to an existing checklist
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const addChecklistItem = async (req, res) => {
  try {
    if (req.user.role !== 'treasurer') {
      return res.status(403).json({ error: 'Access denied. Treasurer role required.' });
    }

    const { checklistId } = req.params;
    const { title, description } = req.body;
    const groupId = req.user.groupId;

    // Validate required fields
    if (!title) {
      return res.status(400).json({ error: 'Item title is required' });
    }

    // Verify the checklist belongs to the treasurer's group
    const checklistResult = await db.query(
      `SELECT id FROM checklists WHERE id = $1 AND group_id = $2`,
      [checklistId, groupId]
    );

    if (checklistResult.rows.length === 0) {
      return res.status(404).json({ error: 'Checklist not found' });
    }

    // Add the new item
    const itemResult = await db.query(
      `INSERT INTO checklist_items (checklist_id, title, description, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING id, title, description, status`,
      [checklistId, title, description]
    );

    res.status(201).json({
      message: 'Checklist item added successfully',
      item: itemResult.rows[0]
    });
  } catch (error) {
    console.error('Add checklist item error:', error);
    res.status(500).json({ error: 'Server error while adding checklist item' });
  }
};

/**
 * Update student status for a checklist item
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateChecklistItemStatus = async (req, res) => {
  try {
    if (req.user.role !== 'treasurer') {
      return res.status(403).json({ error: 'Access denied. Treasurer role required.' });
    }

    const { checklistId, itemId, userId } = req.params;
    const { status } = req.body;
    const groupId = req.user.groupId;

    // Validate required fields
    if (!status || !['pending', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Valid status (pending/completed) is required' });
    }

    // Verify the checklist belongs to the treasurer's group
    const checklistResult = await db.query(
      `SELECT c.id 
       FROM checklists c
       JOIN checklist_items ci ON c.id = ci.checklist_id
       WHERE c.id = $1 AND c.group_id = $2 AND ci.id = $3`,
      [checklistId, groupId, itemId]
    );

    if (checklistResult.rows.length === 0) {
      return res.status(404).json({ error: 'Checklist or item not found' });
    }

    // Verify the user belongs to the treasurer's group
    const userResult = await db.query(
      `SELECT id FROM users WHERE id = $1 AND group_id = $2`,
      [userId, groupId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found in the group' });
    }

    // Upsert the student status
    await db.query(
      `INSERT INTO checklist_student_status (user_id, checklist_item_id, status)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, checklist_item_id) 
       DO UPDATE SET status = $3`,
      [userId, itemId, status]
    );

    res.json({
      message: 'Checklist item status updated successfully',
      user_id: userId,
      checklist_item_id: itemId,
      status
    });
  } catch (error) {
    console.error('Update checklist item status error:', error);
    res.status(500).json({ error: 'Server error while updating checklist item status' });
  }
};

/**
 * Delete a checklist and all its items
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteChecklist = async (req, res) => {
  try {
    if (req.user.role !== 'treasurer') {
      return res.status(403).json({ error: 'Access denied. Treasurer role required.' });
    }

    const { checklistId } = req.params;
    const groupId = req.user.groupId;

    // Verify the checklist belongs to the treasurer's group
    const checklistResult = await db.query(
      `SELECT id FROM checklists WHERE id = $1 AND group_id = $2`,
      [checklistId, groupId]
    );

    if (checklistResult.rows.length === 0) {
      return res.status(404).json({ error: 'Checklist not found' });
    }

    // Start transaction
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // Delete checklist student statuses
      await client.query(
        `DELETE FROM checklist_student_status
         WHERE checklist_item_id IN (
           SELECT id FROM checklist_items WHERE checklist_id = $1
         )`,
        [checklistId]
      );

      // Delete checklist items
      await client.query(
        `DELETE FROM checklist_items WHERE checklist_id = $1`,
        [checklistId]
      );

      // Delete the checklist
      await client.query(
        `DELETE FROM checklists WHERE id = $1`,
        [checklistId]
      );

      await client.query('COMMIT');

      res.json({
        message: 'Checklist deleted successfully'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Delete checklist error:', error);
    res.status(500).json({ error: 'Server error while deleting checklist' });
  }
};

/**
 * Update a checklist item
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateChecklistItem = async (req, res) => {
  try {
    if (req.user.role !== 'treasurer') {
      return res.status(403).json({ error: 'Access denied. Treasurer role required.' });
    }

    const { checklistId, itemId } = req.params;
    const { title, description } = req.body;
    const groupId = req.user.groupId;

    // Validate required fields
    if (!title) {
      return res.status(400).json({ error: 'Item title is required' });
    }

    // Verify the checklist belongs to the treasurer's group and the item exists
    const checklistItemResult = await db.query(
      `SELECT ci.id 
       FROM checklist_items ci
       JOIN checklists c ON ci.checklist_id = c.id
       WHERE ci.id = $1 AND ci.checklist_id = $2 AND c.group_id = $3`,
      [itemId, checklistId, groupId]
    );

    if (checklistItemResult.rows.length === 0) {
      return res.status(404).json({ error: 'Checklist item not found' });
    }

    // Update the item
    const result = await db.query(
      `UPDATE checklist_items 
       SET title = $1, description = $2, updated_at = NOW()
       WHERE id = $3 AND checklist_id = $4
       RETURNING id, title, description, status`,
      [title, description, itemId, checklistId]
    );

    res.json({
      message: 'Checklist item updated successfully',
      item: result.rows[0]
    });
  } catch (error) {
    console.error('Update checklist item error:', error);
    res.status(500).json({ error: 'Server error while updating checklist item' });
  }
};

/**
 * Delete a checklist item
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteChecklistItem = async (req, res) => {
  try {
    if (req.user.role !== 'treasurer') {
      return res.status(403).json({ error: 'Access denied. Treasurer role required.' });
    }

    const { checklistId, itemId } = req.params;
    const groupId = req.user.groupId;

    // Verify the checklist belongs to the treasurer's group and the item exists
    const checklistItemResult = await db.query(
      `SELECT ci.id 
       FROM checklist_items ci
       JOIN checklists c ON ci.checklist_id = c.id
       WHERE ci.id = $1 AND ci.checklist_id = $2 AND c.group_id = $3`,
      [itemId, checklistId, groupId]
    );

    if (checklistItemResult.rows.length === 0) {
      return res.status(404).json({ error: 'Checklist item not found' });
    }

    // Start transaction
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // Delete item status records for all students
      await client.query(
        `DELETE FROM checklist_student_status
         WHERE checklist_item_id = $1`,
        [itemId]
      );

      // Delete the item
      await client.query(
        `DELETE FROM checklist_items WHERE id = $1`,
        [itemId]
      );

      await client.query('COMMIT');

      res.json({
        message: 'Checklist item deleted successfully'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Delete checklist item error:', error);
    res.status(500).json({ error: 'Server error while deleting checklist item' });
  }
};

/**
 * Export checklist status to CSV with item numbers as headers
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const exportChecklistStatus = async (req, res) => {
  try {
    if (req.user.role !== 'treasurer') {
      return res.status(403).json({ error: 'Access denied. Treasurer role required.' });
    }

    const { checklistId } = req.params;
    const groupId = req.user.groupId;

    // Verify the checklist belongs to the treasurer's group
    const checklistResult = await db.query(
      `SELECT id, title, description, due_date 
       FROM checklists 
       WHERE id = $1 AND group_id = $2`,
      [checklistId, groupId]
    );

    if (checklistResult.rows.length === 0) {
      return res.status(404).json({ error: 'Checklist not found' });
    }

    const checklist = checklistResult.rows[0];

    // Get checklist items
    const itemsResult = await db.query(
      `SELECT id, title, description
       FROM checklist_items
       WHERE checklist_id = $1
       ORDER BY id`,
      [checklistId]
    );

    // Get all students in the group
    const studentsResult = await db.query(
      `SELECT id, first_name, last_name
       FROM users
       WHERE group_id = $1 AND role IN ('student', 'finance_coordinator')
       ORDER BY last_name, first_name`,
      [groupId]
    );

    // Get student completion status for each item
    const statusResult = await db.query(
      `SELECT cs.user_id, cs.checklist_item_id, cs.status
       FROM checklist_student_status cs
       JOIN checklist_items ci ON cs.checklist_item_id = ci.id
       WHERE ci.checklist_id = $1`,
      [checklistId]
    );

    // Create CSV headers with item numbers
    let headers = ['Student Name'];
    
    // Map of items with their titles for the CSV header
    const itemTitles = itemsResult.rows.map((item, index) => ({
      id: item.id,
      title: item.title,
      index: index + 1 // 1-based index for item numbers
    }));
    
    // Add item numbers and titles to header
    itemTitles.forEach(item => {
      headers.push(`${item.index}. ${item.title}`);
    });

    // Create CSV rows
    const rows = studentsResult.rows.map(student => {
      const row = [
        `${student.last_name}, ${student.first_name}`
      ];
      
      // Add status for each item
      itemTitles.forEach(item => {
        const studentStatus = statusResult.rows.find(
          status => status.user_id === student.id && status.checklist_item_id === item.id
        );
        const status = studentStatus ? studentStatus.status : 'pending';
        // Use symbols: ✔ for completed, X for pending
        row.push(status === 'completed' ? '✔' : 'X');
      });
      
      return row;
    });

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Set headers for CSV download with the checklist title in filename
    const filename = `${checklist.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_checklist.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

    res.send(csvContent);
  } catch (error) {
    console.error('Export checklist status error:', error);
    res.status(500).json({ error: 'Server error while exporting checklist status' });
  }
};

/**
 * Update user payment status and amount for a specific due
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateUserPaymentStatus = async (req, res) => {
  const client = await db.connect();
  try {
    if (req.user.role !== 'treasurer') {
      return res.status(403).json({ error: 'Access denied. Treasurer role required.' });
    }

    const { dueId, userId } = req.params;
    const { status, amount_paid } = req.body;
    const groupId = req.user.groupId;

    // Validate input
    if (!status || amount_paid === undefined) {
      return res.status(400).json({ error: 'Status and amount_paid are required' });
    }

    const validStatuses = ['pending', 'partially_paid', 'paid', 'overdue'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    if (isNaN(amount_paid) || amount_paid < 0) {
      return res.status(400).json({ error: 'Amount must be a valid non-negative number' });
    }

    await client.query('BEGIN');

    // Verify the due belongs to the treasurer's group and user_due exists
    const verifyResult = await client.query(
      `SELECT ud.id, d.total_amount_due, d.title, u.first_name, u.email
       FROM user_dues ud
       JOIN dues d ON ud.due_id = d.id
       JOIN users u ON ud.user_id = u.id
       WHERE d.id = $1 AND ud.user_id = $2 AND d.group_id = $3`,
      [dueId, userId, groupId]
    );

    if (verifyResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Due or user not found in your group' });
    }

    const { id: userDueId, total_amount_due, title: dueTitle, first_name: userName, email: userEmail } = verifyResult.rows[0];

    // Update the user_dues record
    await client.query(
      `UPDATE user_dues 
       SET amount_paid = $1, 
           status = $2,
           last_payment_date = CASE WHEN $1 > amount_paid THEN NOW() ELSE last_payment_date END
       WHERE id = $3`,
      [amount_paid, status, userDueId]
    );

    await client.query('COMMIT');

    // Send notification if payment was marked as verified
    if (status === 'paid' || status === 'partially_paid') {
      try {
        await notificationService.notifyPaymentVerified({
          userId: userId,
          userEmail: userEmail,
          userName: userName,
          amount: parseFloat(amount_paid),
          dueTitle: dueTitle,
          paymentMethod: 'manual_update',
          paymentId: null
        });
      } catch (notificationError) {
        console.error('Failed to send payment status notification:', notificationError);
      }
    }

    res.json({ 
      message: 'Payment status updated successfully',
      updated: {
        user_due_id: userDueId,
        status,
        amount_paid: parseFloat(amount_paid)
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update user payment status error:', error);
    res.status(500).json({ error: 'Server error while updating payment status' });
  } finally {
    client.release();
  }
};

/**
 * Batch update multiple user payment statuses and amounts for a specific due
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const batchUpdateUserPaymentStatus = async (req, res) => {
  const client = await db.connect();
  try {
    if (req.user.role !== 'treasurer') {
      return res.status(403).json({ error: 'Access denied. Treasurer role required.' });
    }

    const { dueId } = req.params;
    const { updates } = req.body; // Array of { userId, status, amount_paid }
    const groupId = req.user.groupId;

    // Validate input
    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ error: 'Updates array is required and must not be empty' });
    }

    const validStatuses = ['pending', 'partially_paid', 'paid', 'overdue'];
    
    // Validate each update
    for (const update of updates) {
      if (!update.userId || !update.status || update.amount_paid === undefined) {
        return res.status(400).json({ error: 'Each update must have userId, status, and amount_paid' });
      }
      
      if (!validStatuses.includes(update.status)) {
        return res.status(400).json({ error: `Invalid status: ${update.status}` });
      }
      
      if (isNaN(update.amount_paid) || update.amount_paid < 0) {
        return res.status(400).json({ error: 'Amount must be a valid non-negative number' });
      }
    }

    await client.query('BEGIN');

    // Verify the due belongs to the treasurer's group
    const dueResult = await client.query(
      `SELECT d.id, d.total_amount_due, d.title, d.group_id
       FROM dues d
       WHERE d.id = $1 AND d.group_id = $2`,
      [dueId, groupId]
    );

    if (dueResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Due not found in your group' });
    }

    const { total_amount_due, title: dueTitle } = dueResult.rows[0];
    const updatedRecords = [];
    const notificationPromises = [];

    // Process each update
    for (const update of updates) {
      const { userId, status, amount_paid } = update;

      // Validate amount doesn't exceed total due
      if (amount_paid > total_amount_due) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          error: `Amount ${amount_paid} exceeds total due amount ${total_amount_due} for user ${userId}` 
        });
      }

      // Verify user_due exists for this user and due
      const userDueResult = await client.query(
        `SELECT ud.id, u.first_name, u.email, ud.amount_paid as old_amount
         FROM user_dues ud
         JOIN users u ON ud.user_id = u.id
         WHERE ud.due_id = $1 AND ud.user_id = $2`,
        [dueId, userId]
      );

      if (userDueResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: `User ${userId} not found for this due` });
      }

      const { id: userDueId, first_name: userName, email: userEmail, old_amount } = userDueResult.rows[0];

      // Update the user_dues record
      await client.query(
        `UPDATE user_dues 
         SET amount_paid = $1, 
             status = $2,
             last_payment_date = CASE WHEN $1 > $3 THEN NOW() ELSE last_payment_date END
         WHERE id = $4`,
        [amount_paid, status, old_amount, userDueId]
      );

      updatedRecords.push({
        user_due_id: userDueId,
        user_id: userId,
        status,
        amount_paid: parseFloat(amount_paid),
        old_amount: parseFloat(old_amount)
      });

      // Queue notification if payment was marked as verified and amount increased
      if ((status === 'paid' || status === 'partially_paid') && amount_paid > old_amount) {
        notificationPromises.push(
          notificationService.notifyPaymentVerified({
            userId: userId,
            userEmail: userEmail,
            userName: userName,
            amount: parseFloat(amount_paid),
            dueTitle: dueTitle,
            paymentMethod: 'manual_batch_update',
            paymentId: null
          }).catch(error => {
            console.error(`Failed to send notification to user ${userId}:`, error);
          })
        );
      }
    }

    await client.query('COMMIT');

    // Send notifications asynchronously (don't wait for them)
    if (notificationPromises.length > 0) {
      Promise.all(notificationPromises).catch(error => {
        console.error('Some notifications failed to send:', error);
      });
    }

    res.json({ 
      message: `Successfully updated ${updatedRecords.length} payment records`,
      updated: updatedRecords
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Batch update user payment status error:', error);
    res.status(500).json({ error: 'Server error while updating payment statuses' });
  } finally {
    client.release();
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getDashboardData,
  getDues,
  createDue,
  getDueStatus,
  exportDueStatus,
  exportPayments,
  exportSummaryReport,
  exportStudentList,
  verifyPayment,
  rejectPayment,
  getPendingPayments,
  getStats,
  getGroupDetails,
  deleteDue,
  getMembers,
  updateDueDate,
  updateDueStatuses,
  updateAllDueStatuses,
  getChecklists,
  createChecklist,
  getChecklistStatus,
  addChecklistItem,
  updateChecklistItemStatus,
  deleteChecklist,
  updateChecklistItem,
  deleteChecklistItem,
  exportChecklistStatus,
  updateUserPaymentStatus,
  batchUpdateUserPaymentStatus
}; 