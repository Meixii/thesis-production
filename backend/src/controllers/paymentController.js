const db = require('../config/db');
const { uploadToCloudinary } = require('../utils/cloudinary');

/**
 * Submit a new payment for a specific contribution or expense share
 * Expects req.body: { amount, method, referenceId?, receipt?, payment_target: { type: 'weekly_contribution' | 'expense', id: string | number } }
 * For weekly_contribution, id is the week_start_date ('YYYY-MM-DD').
 * For expense, id is the expense_id.
 */
const submitPayment = async (req, res) => {
    const userId = req.user.userId;
    const { amount: paymentAmountStr, method, referenceId } = req.body;
    const payment_target_str = req.body.payment_target;
    const receiptFile = req.file;
    const paymentAmount = parseFloat(paymentAmountStr);

    // Parse payment_target
    let payment_target;
    try {
        if (payment_target_str) {
            payment_target = JSON.parse(payment_target_str);
        }
    } catch (e) {
        return res.status(400).json({ success: false, error: 'Invalid payment_target format. Expected JSON string.' });
    }

    // Basic validation
    if (!paymentAmount || paymentAmount <= 0 || !method || !payment_target || !payment_target.type || !payment_target.id) {
        return res.status(400).json({ success: false, error: 'Missing required payment details: amount, method, or payment_target (type and id).' });
    }

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        const userResult = await client.query('SELECT group_id, last_name FROM users WHERE id = $1', [userId]);
        if (!userResult.rows.length) throw new Error('User not found');
        const groupId = userResult.rows[0].group_id;
        const lastName = userResult.rows[0].last_name || 'Unknown';

        let purpose = '';
        let contributionId = null; // For weekly contribution allocation
        let expenseId = null;      // For expense allocation

        // --- Target Handling Logic --- 
        if (payment_target.type === 'weekly_contribution') {
            const targetWeekStartDateString = payment_target.id.toString();
            const targetDate = new Date(targetWeekStartDateString);
            if (isNaN(targetDate.getTime())) throw new Error('Invalid week_start_date format. Use YYYY-MM-DD.');
            const finalTargetWeekStartDate = targetDate.toISOString().split('T')[0];

            const specificWeekResult = await client.query(
                'SELECT id, week_number FROM thesis_weeks WHERE start_date = $1::DATE LIMIT 1',
                [finalTargetWeekStartDate]
            );
            if (!specificWeekResult.rows.length) throw new Error('Specified target week is not a valid thesis week.');
            const targetThesisWeek = specificWeekResult.rows[0];

            purpose = `Weekly Contribution - Week ${targetThesisWeek.week_number} (${finalTargetWeekStartDate})`;

            const wcResult = await client.query(
                'SELECT id, status, base_contribution_due, penalty_applied, amount_paid FROM weekly_contributions WHERE user_id = $1 AND week_start_date = $2::DATE',
                [userId, finalTargetWeekStartDate]
            );

            if (wcResult.rows.length > 0) {
                const wc = wcResult.rows[0];
                if (wc.status === 'paid') throw new Error(`Contribution for week starting ${finalTargetWeekStartDate} has already been paid.`);
                if (wc.status === 'pending_verification') throw new Error(`A payment for week starting ${finalTargetWeekStartDate} is already pending verification.`);
                contributionId = wc.id;
                // Check if payment amount matches amount remaining (base + penalty - paid)
                const amountRemaining = (parseFloat(wc.base_contribution_due) + (parseFloat(wc.penalty_applied) || 0)) - (parseFloat(wc.amount_paid) || 0);
                if (paymentAmount !== parseFloat(amountRemaining.toFixed(2))) {
                     console.warn(`Payment amount ${paymentAmount} does not match remaining amount ${amountRemaining.toFixed(2)} for week ${finalTargetWeekStartDate}`);
                     // Decide whether to throw error or allow (and maybe only allocate up to remaining?)
                     // For now, let's enforce matching the calculated remaining amount
                     throw new Error(`Payment amount (₱${paymentAmount.toFixed(2)}) must exactly match the remaining amount due (₱${amountRemaining.toFixed(2)}) for the selected week.`);
                 }
            } else {
                const baseDue = 10.00;
                 if (paymentAmount !== baseDue) {
                     throw new Error(`Payment amount (₱${paymentAmount.toFixed(2)}) must exactly match the base amount due (₱${baseDue.toFixed(2)}) for a new weekly contribution.`);
                 }
                const newWcResult = await client.query(
                    `INSERT INTO weekly_contributions (user_id, group_id, week_start_date, status, base_contribution_due, penalty_applied, amount_paid)
                     VALUES ($1, $2, $3::DATE, 'unpaid', $4, 0, 0) RETURNING id`,
                    [userId, groupId, finalTargetWeekStartDate, baseDue]
                );
                contributionId = newWcResult.rows[0].id;
            }
        } else if (payment_target.type === 'expense') {
            expenseId = parseInt(payment_target.id.toString(), 10);
            if (isNaN(expenseId)) throw new Error('Invalid expense ID.');

            // Check if the expense exists, is distributed, and get amount_per_student
            const expenseResult = await client.query(
                'SELECT description, amount_per_student, is_distributed FROM expenses WHERE id = $1 AND group_id = $2',
                [expenseId, groupId]
            );
            if (!expenseResult.rows.length) throw new Error('Expense not found or does not belong to your group.');
            const expense = expenseResult.rows[0];
            if (!expense.is_distributed) throw new Error('This expense has not been marked for distribution.');
            if (!expense.amount_per_student || parseFloat(expense.amount_per_student) <= 0) throw new Error('Invalid amount per student defined for this expense.');

            const amountDuePerStudent = parseFloat(expense.amount_per_student);
            purpose = `Expense Payment: ${expense.description.substring(0, 50)} (ID: ${expenseId})`;

            // Check if payment amount matches the required amount per student
            if (paymentAmount !== amountDuePerStudent) {
                throw new Error(`Payment amount (₱${paymentAmount.toFixed(2)}) must exactly match the required share (₱${amountDuePerStudent.toFixed(2)}) for this expense.`);
            }

            // Check if the user has already paid their share for this expense
            const existingPaymentResult = await client.query(
                'SELECT ep.id FROM expense_payments ep JOIN payments p ON ep.payment_id = p.id WHERE ep.expense_id = $1 AND ep.user_id = $2 AND p.status = $3 LIMIT 1',
                [expenseId, userId, 'verified'] // Check for VERIFIED payments linked
            );
             if (existingPaymentResult.rows.length > 0) {
                throw new Error('You have already paid your share for this expense.');
            }
            // Check for pending payments for the same expense share
             const pendingPaymentResult = await client.query(
                'SELECT ep.id FROM expense_payments ep JOIN payments p ON ep.payment_id = p.id WHERE ep.expense_id = $1 AND ep.user_id = $2 AND p.status = $3 LIMIT 1',
                [expenseId, userId, 'pending_verification'] 
            );
             if (pendingPaymentResult.rows.length > 0) {
                throw new Error('A payment for your share of this expense is already pending verification.');
            }

        } else {
            throw new Error('Invalid payment_target type specified.');
        }
        // --- End Target Handling --- 

        let receiptUrl = null;
        if (receiptFile) {
            try {
                const uploadResult = await uploadToCloudinary(receiptFile, { lastName, paymentMethod: method, userId });
                receiptUrl = uploadResult.secure_url;
            } catch (uploadError) {
                console.error('Receipt upload failed:', uploadError);
                if (process.env.NODE_ENV !== 'production') {
                    await client.query('ROLLBACK'); client.release();
                    return res.status(500).json({ success: false, error: 'Receipt upload failed: ' + uploadError.message });
                }
                 console.warn('Proceeding without receipt due to upload error.');
            }
        }

        const paymentResult = await client.query(
            `INSERT INTO payments (user_id, group_id, amount, method, status, reference_id, receipt_url, purpose)
             VALUES ($1, $2, $3, $4, 'pending_verification', $5, $6, $7) RETURNING id`,
            [userId, groupId, paymentAmount, method, referenceId || null, receiptUrl, purpose]
        );
        const paymentId = paymentResult.rows[0].id;

        // --- Allocation Logic --- 
        if (payment_target.type === 'weekly_contribution' && contributionId) {
            await client.query(
                'INSERT INTO payment_allocations (payment_id, contribution_id, amount_allocated) VALUES ($1, $2, $3)',
                [paymentId, contributionId, paymentAmount]
            );
            // Set the contribution status to pending
            await client.query(
                `UPDATE weekly_contributions SET status = 'pending_verification', updated_at = NOW() WHERE id = $1`,
                [contributionId]
            );
        } else if (payment_target.type === 'expense' && expenseId) {
            // Insert into expense_payments - this link is made BEFORE verification
            // Verification step will confirm this payment and finalize the student's share as paid.
             await client.query(
                 'INSERT INTO expense_payments (expense_id, user_id, payment_id, amount_paid) VALUES ($1, $2, $3, $4)',
                 [expenseId, userId, paymentId, paymentAmount]
             );
        }
        // --- End Allocation Logic --- 

        await client.query('COMMIT');
        res.json({
            success: true,
            message: `Payment for '${purpose}' submitted successfully and is pending verification.`,
            data: { paymentId, status: 'pending_verification' }
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Payment submission error within transaction:', err);
        return res.status(500).json({ success: false, error: err.message });
    } finally {
        client.release();
    }
};

/**
 * Reject a payment (Finance Coordinator only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const rejectPayment = async (req, res) => {
  const { paymentId } = req.params;
  const { notes } = req.body;
  const verifierId = req.user.userId;
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const paymentUpdateResult = await client.query(
        `UPDATE payments SET status = 'rejected', verified_at = CURRENT_TIMESTAMP, verified_by_user_id = $1, notes = $2 
         WHERE id = $3 AND status = 'pending_verification' RETURNING id, user_id, amount, purpose`,
        [verifierId, notes, paymentId]
      );

    if (paymentUpdateResult.rows.length === 0) {
      throw new Error('Payment not found or not pending verification.');
    }
    const payment = paymentUpdateResult.rows[0];

    // --- Revert Logic based on Purpose --- 
    if (payment.purpose && payment.purpose.toLowerCase().startsWith('weekly contribution')) {
        const allocationResult = await client.query('SELECT contribution_id FROM payment_allocations WHERE payment_id = $1', [paymentId]);
        for (const alloc of allocationResult.rows) {
            await client.query(
                `UPDATE weekly_contributions SET status = CASE WHEN amount_paid < base_contribution_due THEN 'unpaid' ELSE 'paid' END, updated_at = NOW()
                 WHERE id = $1 AND status = 'pending_verification'`,
                [alloc.contribution_id]
            );
            // Note: More complex logic might be needed if partial payments for a week were allowed and one is rejected.
            // Simple revert to 'unpaid' might be safest if exact previous state isn't stored.
        }
    } else if (payment.purpose && payment.purpose.toLowerCase().startsWith('expense payment')) {
        // If an expense payment is rejected, the link in expense_payments remains, but the payment status is 'rejected'.
        // The student would still show as *not* having paid their share when checked via `payable-expenses`.
        // No direct status change on `expenses` needed.
        // Optionally, delete the link? For now, leave it as rejected.
        // await client.query('DELETE FROM expense_payments WHERE payment_id = $1', [paymentId]);
    }
    // --- End Revert Logic ---

    await client.query('COMMIT');
    res.json({ success: true, message: 'Payment rejected', data: { paymentId, status: 'rejected' } });

  } catch (err) {
      await client.query('ROLLBACK');
      console.error('Payment rejection error within transaction:', err);
      res.status(500).json({ success: false, error: err.message });
  } finally {
      client.release();
  }
};

/**
 * Verify a payment (Finance Coordinator only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const verifyPayment = async (req, res) => {
    const { paymentId } = req.params;
    const { notes } = req.body; // Status is implicitly 'verified'
    const verifierId = req.user.userId;

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        const paymentUpdateResult = await client.query(
            `UPDATE payments SET status = 'verified', verified_at = CURRENT_TIMESTAMP, verified_by_user_id = $1, notes = $2
             WHERE id = $3 AND status = 'pending_verification' RETURNING id, user_id, group_id, amount, purpose`,
            [verifierId, notes, paymentId]
        );

        if (paymentUpdateResult.rows.length === 0) {
            throw new Error('Payment not found, not pending verification, or already processed.');
        }
        const payment = paymentUpdateResult.rows[0];

        // --- Handle Allocation based on Purpose --- 
        if (payment.purpose && payment.purpose.toLowerCase().startsWith('weekly contribution')) {
            const allocationsResult = await client.query('SELECT pa.contribution_id, pa.amount_allocated FROM payment_allocations pa WHERE pa.payment_id = $1', [paymentId]);
            for (const alloc of allocationsResult.rows) {
                const contribUpdateResult = await client.query(
                    `UPDATE weekly_contributions SET amount_paid = amount_paid + $1, updated_at = NOW() WHERE id = $2 RETURNING id, amount_paid, base_contribution_due, penalty_applied`,
                    [alloc.amount_allocated, alloc.contribution_id]
                );
                if (contribUpdateResult.rows.length > 0) {
                    const c = contribUpdateResult.rows[0];
                    const totalDue = parseFloat(c.base_contribution_due) + (parseFloat(c.penalty_applied) || 0);
                    if (parseFloat(c.amount_paid) >= totalDue) {
                        await client.query("UPDATE weekly_contributions SET status = 'paid' WHERE id = $1", [c.id]);
                    }
                }
            }
        } else if (payment.purpose && payment.purpose.toLowerCase().startsWith('loan repayment id')) {
            const match = payment.purpose.match(/loan repayment id (\d+)/i);
            if (match) {
                const loanId = parseInt(match[1]);
                // Check if repayment record already exists for this payment_id to prevent duplicates
                const existingRepayment = await client.query('SELECT id FROM loan_repayments WHERE payment_id = $1', [paymentId]);
                if (existingRepayment.rows.length === 0) {
                    await client.query('INSERT INTO loan_repayments (loan_id, payment_id, amount, repayment_date, recorded_by_user_id) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4)', [loanId, paymentId, payment.amount, verifierId]);
                    await client.query('UPDATE loans SET total_amount_repaid = COALESCE(total_amount_repaid, 0) + $1 WHERE id = $2', [payment.amount, loanId]);
                    const loanDetails = await client.query('SELECT amount_approved, total_amount_repaid FROM loans WHERE id = $1', [loanId]);
                    if (loanDetails.rows.length > 0) {
                        const l = loanDetails.rows[0];
                        if (parseFloat(l.total_amount_repaid) >= parseFloat(l.amount_approved)) {
                            await client.query("UPDATE loans SET status = 'fully_repaid' WHERE id = $1", [loanId]);
                        }
                    }
                 } else {
                     console.warn(`Loan repayment record for payment_id ${paymentId} already exists. Skipping insertion.`);
                 }
            }
        } else if (payment.purpose && payment.purpose.toLowerCase().startsWith('due payment:')) {
            const allocationsResult = await client.query('SELECT pad.user_due_id, pad.amount_allocated FROM payment_allocations_dues pad WHERE pad.payment_id = $1', [paymentId]);
            for (const alloc of allocationsResult.rows) {
                 // Check if due payment record already exists for this payment_id and user_due_id?
                 // Not strictly necessary as verify should only happen once, but good practice?
                const userDueUpdateResult = await client.query(
                    `UPDATE user_dues SET amount_paid = amount_paid + $1, last_payment_date = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, amount_paid, (SELECT total_amount_due FROM dues WHERE id = user_dues.due_id) as total_due_for_this_item`,
                    [alloc.amount_allocated, alloc.user_due_id]
                );
                if (userDueUpdateResult.rows.length > 0) {
                    const ud = userDueUpdateResult.rows[0];
                    if (parseFloat(ud.amount_paid) >= parseFloat(ud.total_due_for_this_item)) {
                        await client.query("UPDATE user_dues SET status = 'paid' WHERE id = $1", [ud.id]);
                    } else if (parseFloat(ud.amount_paid) > 0) {
                        await client.query("UPDATE user_dues SET status = 'partially_paid' WHERE id = $1", [ud.id]);
                    }
                }
            }
        } else if (payment.purpose && payment.purpose.toLowerCase().startsWith('expense payment')) {
            // When verifying an expense payment, the link was already created in submitPayment
            // We just confirm the payment status. The expense_payments table serves as the record of who paid.
             console.log(`Verified expense payment: Payment ID ${paymentId}, Purpose: ${payment.purpose}`);
             // No further action needed on expense_payments table here, the link exists and payment is now verified.
        }
        // --- End Allocation Handling ---

        await client.query('COMMIT');
        res.json({
            success: true,
            message: `Payment verified successfully.`,
            data: { paymentId, status: 'verified' }
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Payment verification error within transaction:', err);
        res.status(500).json({ success: false, error: err.message });
    } finally {
        client.release();
    }
};

module.exports = {
  submitPayment,
  verifyPayment,
  rejectPayment
}; 