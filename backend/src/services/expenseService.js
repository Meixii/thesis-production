const db = require('../config/db');
const { notifyExpenseStatusChange } = require('./notificationService');

/**
 * Get all expense requests for a student
 * @param {number} userId - User ID
 * @returns {Promise<Array>} Array of expense requests
 */
const getStudentExpenses = async (userId) => {
  try {
    const result = await db.query(
      `SELECT er.*, ec.name as category_name, ec.description as category_description, ec.is_emergency,
              u.first_name as approved_by_first_name, u.last_name as approved_by_last_name
       FROM expense_requests er
       LEFT JOIN expense_categories ec ON er.category_id = ec.id
       LEFT JOIN users u ON er.approved_by = u.id
       WHERE er.user_id = $1
       ORDER BY er.created_at DESC`,
      [userId]
    );

    return result.rows.map(row => ({
      id: row.id,
      categoryId: row.category_id,
      category: {
        id: row.category_id,
        name: row.category_name,
        description: row.category_description,
        isEmergency: row.is_emergency
      },
      title: row.title,
      description: row.description,
      amount: parseFloat(row.amount),
      status: row.status,
      isEmergency: row.is_emergency,
      repaymentDeadline: row.repayment_deadline,
      repaymentAmount: row.repayment_amount ? parseFloat(row.repayment_amount) : null,
      proofRequired: row.proof_required,
      approvedBy: row.approved_by ? {
        id: row.approved_by,
        firstName: row.approved_by_first_name,
        lastName: row.approved_by_last_name
      } : null,
      approvedAt: row.approved_at,
      createdAt: row.created_at
    }));
  } catch (error) {
    console.error('Error getting student expenses:', error);
    throw error;
  }
};

/**
 * Get expense categories
 * @returns {Promise<Array>} Array of expense categories
 */
const getExpenseCategories = async () => {
  try {
    const result = await db.query(
      'SELECT * FROM expense_categories ORDER BY name'
    );
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      isEmergency: row.is_emergency
    }));
  } catch (error) {
    console.error('Error getting expense categories:', error);
    throw error;
  }
};

/**
 * Create a new expense request
 * @param {Object} data - Expense request data
 * @param {number} data.userId - User ID
 * @param {number} data.categoryId - Category ID
 * @param {string} data.title - Expense title
 * @param {string} data.description - Expense description
 * @param {number} data.amount - Expense amount
 * @returns {Promise<Object>} Created expense request
 */
const createExpenseRequest = async (data) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // Get category details
    const categoryResult = await client.query(
      'SELECT * FROM expense_categories WHERE id = $1',
      [data.categoryId]
    );
    if (categoryResult.rows.length === 0) {
      throw new Error('Invalid category');
    }
    const category = categoryResult.rows[0];

    // Calculate repayment details for emergency funds
    let repaymentDeadline = null;
    let repaymentAmount = null;
    if (category.is_emergency) {
      // Set repayment deadline to 30 days from now
      repaymentDeadline = new Date();
      repaymentDeadline.setDate(repaymentDeadline.getDate() + 30);
      repaymentAmount = data.amount;
    }

    // Create expense request
    const result = await client.query(
      `INSERT INTO expense_requests (
        user_id, category_id, title, description, amount,
        status, is_emergency, repayment_deadline, repayment_amount,
        proof_required, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        data.userId,
        data.categoryId,
        data.title,
        data.description,
        data.amount,
        'pending',
        category.is_emergency,
        repaymentDeadline,
        repaymentAmount,
        true
      ]
    );

    await client.query('COMMIT');

    const expenseRequest = result.rows[0];
    return {
      id: expenseRequest.id,
      categoryId: expenseRequest.category_id,
      category: {
        id: category.id,
        name: category.name,
        description: category.description,
        isEmergency: category.is_emergency
      },
      title: expenseRequest.title,
      description: expenseRequest.description,
      amount: parseFloat(expenseRequest.amount),
      status: expenseRequest.status,
      isEmergency: expenseRequest.is_emergency,
      repaymentDeadline: expenseRequest.repayment_deadline,
      repaymentAmount: expenseRequest.repayment_amount ? parseFloat(expenseRequest.repayment_amount) : null,
      proofRequired: expenseRequest.proof_required,
      createdAt: expenseRequest.created_at
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating expense request:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get expense request details
 * @param {number} expenseId - Expense request ID
 * @param {number} userId - User ID (for authorization)
 * @returns {Promise<Object>} Expense request details
 */
const getExpenseRequestDetails = async (expenseId, userId) => {
  try {
    const result = await db.query(
      `SELECT er.*, ec.name as category_name, ec.description as category_description,
              ec.is_emergency, u.first_name as approved_by_first_name,
              u.last_name as approved_by_last_name,
              ARRAY_AGG(
                DISTINCT jsonb_build_object(
                  'id', ep.id,
                  'proofType', ep.proof_type,
                  'fileUrl', ep.file_url,
                  'verified', ep.verified,
                  'verifiedAt', ep.verified_at,
                  'createdAt', ep.created_at
                )
              ) FILTER (WHERE ep.id IS NOT NULL) as proofs
       FROM expense_requests er
       LEFT JOIN expense_categories ec ON er.category_id = ec.id
       LEFT JOIN users u ON er.approved_by = u.id
       LEFT JOIN expense_proofs ep ON er.id = ep.expense_request_id
       WHERE er.id = $1 AND er.user_id = $2
       GROUP BY er.id, ec.id, u.id`,
      [expenseId, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Expense request not found');
    }

    const row = result.rows[0];
    return {
      id: row.id,
      categoryId: row.category_id,
      category: {
        id: row.category_id,
        name: row.category_name,
        description: row.category_description,
        isEmergency: row.is_emergency
      },
      title: row.title,
      description: row.description,
      amount: parseFloat(row.amount),
      status: row.status,
      isEmergency: row.is_emergency,
      repaymentDeadline: row.repayment_deadline,
      repaymentAmount: row.repayment_amount ? parseFloat(row.repayment_amount) : null,
      proofRequired: row.proof_required,
      approvedBy: row.approved_by ? {
        id: row.approved_by,
        firstName: row.approved_by_first_name,
        lastName: row.approved_by_last_name
      } : null,
      approvedAt: row.approved_at,
      createdAt: row.created_at,
      proofs: row.proofs || []
    };
  } catch (error) {
    console.error('Error getting expense request details:', error);
    throw error;
  }
};

/**
 * Get all expense requests for treasurer review
 * @returns {Promise<Array>} Array of all expense requests
 */
const getAllExpenses = async () => {
  try {
    const result = await db.query(
      `SELECT er.*, ec.name as category_name, ec.description as category_description, ec.is_emergency,
              u.first_name as user_first_name, u.last_name as user_last_name, u.email as user_email,
              approver.first_name as approved_by_first_name, approver.last_name as approved_by_last_name,
              ep.proof_type, ep.file_url, ep.created_at as proof_uploaded_at
       FROM expense_requests er
       LEFT JOIN expense_categories ec ON er.category_id = ec.id
       LEFT JOIN users u ON er.user_id = u.id
       LEFT JOIN users approver ON er.approved_by = approver.id
       LEFT JOIN expense_proofs ep ON er.id = ep.expense_request_id
       ORDER BY er.created_at DESC`
    );

    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      user: {
        firstName: row.user_first_name,
        lastName: row.user_last_name,
        email: row.user_email
      },
      categoryId: row.category_id,
      category: {
        id: row.category_id,
        name: row.category_name,
        description: row.category_description,
        isEmergency: row.is_emergency
      },
      title: row.title,
      description: row.description,
      amount: parseFloat(row.amount),
      status: row.status,
      isEmergency: row.is_emergency,
      repaymentDeadline: row.repayment_deadline,
      repaymentAmount: row.repayment_amount ? parseFloat(row.repayment_amount) : null,
      proofRequired: row.proof_required,
      approvedBy: row.approved_by ? {
        id: row.approved_by,
        firstName: row.approved_by_first_name,
        lastName: row.approved_by_last_name
      } : null,
      approvedAt: row.approved_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
             proof: row.proof_type ? {
         id: row.id,
         proofType: row.proof_type,
         fileUrl: row.file_url,
         uploadedAt: row.proof_uploaded_at
       } : null
    }));
  } catch (error) {
    console.error('Error getting all expenses:', error);
    throw error;
  }
};

/**
 * Get expense statistics for treasurer dashboard
 * @returns {Promise<Object>} Expense statistics
 */
const getExpenseStats = async () => {
  try {
    const result = await db.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN status = 'denied' THEN 1 END) as denied,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as pending_amount,
        COALESCE(SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END), 0) as approved_amount
      FROM expense_requests
    `);

    const stats = result.rows[0];
    return {
      total: parseInt(stats.total),
      pending: parseInt(stats.pending),
      approved: parseInt(stats.approved),
      denied: parseInt(stats.denied),
      completed: parseInt(stats.completed),
      totalAmount: parseFloat(stats.total_amount),
      pendingAmount: parseFloat(stats.pending_amount),
      approvedAmount: parseFloat(stats.approved_amount)
    };
  } catch (error) {
    console.error('Error getting expense stats:', error);
    throw error;
  }
};

/**
 * Approve an expense request
 * @param {number} expenseId - Expense request ID
 * @param {number} approverId - ID of the treasurer approving the request
 * @returns {Promise<Object>} Updated expense request
 */
const approveExpenseRequest = async (expenseId, approverId) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // Check if expense request exists and is pending
    const expenseResult = await client.query(
      'SELECT * FROM expense_requests WHERE id = $1',
      [expenseId]
    );
    
    if (expenseResult.rows.length === 0) {
      throw new Error('Expense request not found');
    }

    const expense = expenseResult.rows[0];
    if (expense.status !== 'pending') {
      throw new Error('Expense request is not pending');
    }

    // Update expense request status
    const result = await client.query(
      `UPDATE expense_requests 
       SET status = 'approved', approved_by = $1, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [approverId, expenseId]
    );

    await client.query('COMMIT');

    // Notify about status change
    await notifyExpenseStatusChange({
      expenseId: expenseId,
      userId: expense.user_id,
      status: 'approved'
    });

    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error approving expense request:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Deny an expense request
 * @param {number} expenseId - Expense request ID
 * @param {number} denierId - ID of the treasurer denying the request
 * @param {string} reason - Reason for denial
 * @returns {Promise<Object>} Updated expense request
 */
const denyExpenseRequest = async (expenseId, denierId, reason) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // Check if expense request exists and is pending
    const expenseResult = await client.query(
      'SELECT * FROM expense_requests WHERE id = $1',
      [expenseId]
    );
    
    if (expenseResult.rows.length === 0) {
      throw new Error('Expense request not found');
    }

    const expense = expenseResult.rows[0];
    if (expense.status !== 'pending') {
      throw new Error('Expense request is not pending');
    }

    // Update expense request status
    const result = await client.query(
      `UPDATE expense_requests 
       SET status = 'denied', approved_by = $1, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [denierId, expenseId]
    );

    await client.query('COMMIT');

    // Notify about status change
    await notifyExpenseStatusChange({
      expenseId: expenseId,
      userId: expense.user_id,
      status: 'denied',
      reason: reason
    });

    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error denying expense request:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Upload proof for an expense request
 * @param {Object} data - Proof data
 * @param {number} data.expenseId - Expense request ID
 * @param {number} data.userId - User ID (for authorization)
 * @param {string} data.proofType - Type of proof (receipt, photo, document)
 * @param {string} data.fileUrl - URL of the uploaded file
 * @returns {Promise<Object>} Created proof
 */
const uploadExpenseProof = async (data) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // Verify expense request exists and belongs to user
    const expenseResult = await client.query(
      'SELECT * FROM expense_requests WHERE id = $1 AND user_id = $2',
      [data.expenseId, data.userId]
    );
    if (expenseResult.rows.length === 0) {
      throw new Error('Expense request not found');
    }

    // Create proof
    const result = await client.query(
      `INSERT INTO expense_proofs (
        expense_request_id, proof_type, file_url,
        uploaded_by, created_at
      ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        data.expenseId,
        data.proofType,
        data.fileUrl,
        data.userId
      ]
    );

    // Update expense request status to completed if it was approved
    if (expenseResult.rows[0].status === 'approved') {
      await client.query(
        'UPDATE expense_requests SET status = $1 WHERE id = $2',
        ['completed', data.expenseId]
      );

      // Notify about status change
      await notifyExpenseStatusChange({
        expenseId: data.expenseId,
        userId: data.userId,
        status: 'completed'
      });
    }

    await client.query('COMMIT');

    const proof = result.rows[0];
    return {
      id: proof.id,
      expenseRequestId: proof.expense_request_id,
      proofType: proof.proof_type,
      fileUrl: proof.file_url,
      uploadedBy: proof.uploaded_by,
      verified: proof.verified,
      verifiedBy: proof.verified_by,
      verifiedAt: proof.verified_at,
      createdAt: proof.created_at
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error uploading expense proof:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  getStudentExpenses,
  getExpenseCategories,
  createExpenseRequest,
  getExpenseRequestDetails,
  uploadExpenseProof,
  getAllExpenses,
  getExpenseStats,
  approveExpenseRequest,
  denyExpenseRequest
};
