const db = require('../config/db');
const { uploadToCloudinary } = require('../utils/cloudinary');

/**
 * Submit a new payment
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const submitPayment = async (req, res) => {
  const userId = req.user.userId;
  const { amount, method, referenceId } = req.body;
  const receiptFile = req.file;

  try {
    // Start transaction
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // Get user's group
      const userResult = await client.query(
        'SELECT group_id, last_name FROM users WHERE id = $1',
        [userId]
      );

      if (!userResult.rows.length) {
        throw new Error('User not found');
      }

      const groupId = userResult.rows[0].group_id;
      const lastName = userResult.rows[0].last_name || 'Unknown';

      // Upload receipt if provided
      let receiptUrl = null;
      if (receiptFile) {
        try {
          console.log(`Attempting to upload receipt for user ${userId} with payment method ${method}`);
          const uploadResult = await uploadToCloudinary(receiptFile, {
            lastName,
            paymentMethod: method,
            userId
          });
          
          receiptUrl = uploadResult.secure_url;
          console.log(`Receipt uploaded successfully: ${receiptUrl}`);
          
          // Store additional receipt metadata if available
          const receiptMetadata = {
            publicId: uploadResult.public_id,
            originalName: uploadResult.original_filename || receiptFile.originalname,
            format: uploadResult.format,
            resourceType: uploadResult.resource_type,
            timestamp: new Date().toISOString()
          };
          
          console.log('Receipt metadata:', JSON.stringify(receiptMetadata, null, 2));
        } catch (uploadError) {
          console.error('Receipt upload failed:', uploadError);
          // Continue without receipt if upload fails in production
          // In development/testing, we might want to fail the whole operation
          if (process.env.NODE_ENV === 'production') {
            // Log the error but continue
            console.warn('Continuing payment processing without receipt image');
          } else {
            throw new Error('Receipt upload failed: ' + uploadError.message);
          }
        }
      }

      // Create payment record
      const paymentResult = await client.query(`
        INSERT INTO payments (
          user_id,
          group_id,
          amount,
          method,
          status,
          reference_id,
          receipt_url
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `, [
        userId,
        groupId,
        amount,
        method,
        method === 'cash' ? 'pending_verification' : 'pending_verification',
        referenceId || null,
        receiptUrl
      ]);

      const paymentId = paymentResult.rows[0].id;

      // Get current week's contribution record
      const currentDate = new Date();
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const contributionResult = await client.query(`
        SELECT id, base_contribution_due, penalty_applied, amount_paid
        FROM weekly_contributions
        WHERE user_id = $1 AND week_start_date = $2
      `, [userId, startOfWeek]);

      let contributionId;
      if (contributionResult.rows.length === 0) {
        // Create new contribution record if it doesn't exist
        const newContributionResult = await client.query(`
          INSERT INTO weekly_contributions (
            user_id,
            group_id,
            week_start_date,
            status,
            base_contribution_due,
            penalty_applied,
            amount_paid
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id
        `, [
          userId,
          groupId,
          startOfWeek,
          'unpaid',
          10, // Base contribution
          0, // Initial penalty
          0 // Initial amount paid
        ]);
        contributionId = newContributionResult.rows[0].id;
      } else {
        contributionId = contributionResult.rows[0].id;
      }

      // Link payment to contribution
      await client.query(`
        INSERT INTO payment_allocations (
          payment_id,
          contribution_id,
          amount_allocated
        )
        VALUES ($1, $2, $3)
      `, [
        paymentId,
        contributionId,
        amount
      ]);

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Payment submitted successfully',
        data: {
          paymentId,
          status: 'pending_verification'
        }
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Payment submission error:', err);
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

/**
 * Verify a payment (Finance Coordinator only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const verifyPayment = async (req, res) => {
  const { paymentId } = req.params;
  const { status, notes } = req.body;
  const verifierId = req.user.userId;

  try {
    // Start transaction
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // Update payment status
      const paymentResult = await client.query(`
        UPDATE payments
        SET status = $1,
            verified_at = CURRENT_TIMESTAMP,
            verified_by_user_id = $2,
            notes = $3
        WHERE id = $4
        RETURNING user_id, group_id, amount
      `, [status, verifierId, notes, paymentId]);

      if (paymentResult.rows.length === 0) {
        throw new Error('Payment not found');
      }

      const payment = paymentResult.rows[0];

      if (status === 'verified') {
        // Update contribution status
        await client.query(`
          UPDATE weekly_contributions wc
          SET status = 'paid',
              amount_paid = amount_paid + pa.amount_allocated
          FROM payment_allocations pa
          WHERE pa.payment_id = $1
          AND pa.contribution_id = wc.id
        `, [paymentId]);
      }

      await client.query('COMMIT');

      res.json({
        success: true,
        message: `Payment ${status}`,
        data: {
          paymentId,
          status
        }
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Payment verification error:', err);
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

module.exports = {
  submitPayment,
  verifyPayment
}; 