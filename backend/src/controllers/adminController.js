const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { spawn } = require('child_process');
const archiver = require('archiver');
const fs = require('fs');
const os = require('os');
const path = require('path');

/**
 * Get all thesis weeks (optionally filtered by group_id)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getThesisWeeks = async (req, res) => {
  try {
    // Only admin can access
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const { group_id } = req.query;
    let result;
    if (group_id) {
      result = await db.query(
        `SELECT w.id, w.week_number, w.start_date, w.end_date, w.group_id, g.group_name
         FROM thesis_weeks w
         LEFT JOIN groups g ON w.group_id = g.id
         WHERE w.group_id = $1
         ORDER BY w.week_number ASC`,
        [group_id]
      );
    } else {
      result = await db.query(
        `SELECT w.id, w.week_number, w.start_date, w.end_date, w.group_id, g.group_name
         FROM thesis_weeks w
         LEFT JOIN groups g ON w.group_id = g.id
         ORDER BY w.week_number ASC`
      );
    }

    res.json({
      thesis_weeks: result.rows
    });
  } catch (error) {
    console.error('Get thesis weeks error:', error);
    res.status(500).json({ error: 'Server error while fetching thesis weeks' });
  }
};

/**
 * Create or update a thesis week (with group_id)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const upsertThesisWeek = async (req, res) => {
  try {
    // Only admin can access
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const { id, week_number, start_date, end_date, group_id } = req.body;

    // Log received values for debugging date issues
    console.log('upsertThesisWeek received:', {
      week_number,
      start_date,
      end_date,
      group_id
    });

    if (!week_number || !start_date || !end_date || !group_id) {
      return res.status(400).json({ error: 'Week number, start date, end date, and group_id are required' });
    }

    let result;
    if (id) {
      // Update existing thesis week
      result = await db.query(
        `UPDATE thesis_weeks
         SET week_number = $1, start_date = $2, end_date = $3, group_id = $4
         WHERE id = $5
         RETURNING id, week_number, start_date, end_date, group_id`,
        [week_number, start_date, end_date, group_id, id]
      );
    } else {
      // Create new thesis week
      result = await db.query(
        `INSERT INTO thesis_weeks (week_number, start_date, end_date, group_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id, week_number, start_date, end_date, group_id`,
        [week_number, start_date, end_date, group_id]
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Failed to create or update thesis week' });
    }

    res.json({
      message: id ? 'Thesis week updated successfully' : 'Thesis week created successfully',
      thesis_week: result.rows[0]
    });
  } catch (error) {
    console.error('Upsert thesis week error:', error);
    res.status(500).json({ error: 'Server error while creating/updating thesis week' });
  }
};

/**
 * Delete a thesis week
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteThesisWeek = async (req, res) => {
  try {
    // Only admin can access
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const { weekId } = req.params;

    const result = await db.query(
      `DELETE FROM thesis_weeks
       WHERE id = $1
       RETURNING id`,
      [weekId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Thesis week not found' });
    }

    res.json({
      message: 'Thesis week deleted successfully',
      id: result.rows[0].id
    });
  } catch (error) {
    console.error('Delete thesis week error:', error);
    res.status(500).json({ error: 'Server error while deleting thesis week' });
  }
};

/**
 * Get all users with their roles and groups
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUsers = async (req, res) => {
  try {
    // Only admin can access
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const result = await db.query(
      `SELECT 
         u.id, 
         u.first_name, 
         u.middle_name,
         u.last_name, 
         u.suffix,
         u.email, 
         u.role, 
         u.is_active,
         g.id as group_id, 
         g.group_name
       FROM users u
       LEFT JOIN groups g ON u.group_id = g.id
       ORDER BY u.last_name, u.first_name`
    );

    res.json({
      users: result.rows.map(user => ({
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
        group: {
          id: user.group_id,
          name: user.group_name
        },
        first_name: user.first_name,
        last_name: user.last_name,
        middle_name: user.middle_name,
        suffix: user.suffix
      }))
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error while fetching users' });
  }
};

/**
 * Update a user's role
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateUserRole = async (req, res) => {
  try {
    // Only admin can access
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const { userId } = req.params;
    const { role, is_active, group_id } = req.body;

    if (!role) {
      return res.status(400).json({ error: 'Role is required' });
    }

    // Check if user exists
    const userCheck = await db.query(
      'SELECT id FROM users WHERE id = $1',
      [userId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user
    const result = await db.query(
      `UPDATE users
       SET 
         role = $1,
         is_active = $2,
         group_id = $3
       WHERE id = $4
       RETURNING id, first_name, last_name, email, role, is_active, group_id`,
      [role, is_active !== undefined ? is_active : true, group_id, userId]
    );

    // Get group name
    let groupName = null;
    if (result.rows[0].group_id) {
      const groupResult = await db.query(
        'SELECT group_name FROM groups WHERE id = $1',
        [result.rows[0].group_id]
      );
      if (groupResult.rows.length > 0) {
        groupName = groupResult.rows[0].group_name;
      }
    }

    res.json({
      message: 'User updated successfully',
      user: {
        id: result.rows[0].id,
        name: `${result.rows[0].first_name} ${result.rows[0].last_name}`,
        email: result.rows[0].email,
        role: result.rows[0].role,
        is_active: result.rows[0].is_active,
        group: {
          id: result.rows[0].group_id,
          name: groupName
        }
      }
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Server error while updating user role' });
  }
};

/**
 * Get all groups (thesis groups only for admin)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getGroups = async (req, res) => {
  try {
    // Only admin can access
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const result = await db.query(
      `SELECT 
         g.id, 
         g.group_name, 
         g.group_type,
         g.budget_goal,
         g.max_intra_loan_per_student,
         g.max_inter_loan_limit,
         g.intra_loan_flat_fee,
         g.group_code,
         (SELECT COUNT(*) FROM users WHERE group_id = g.id) as member_count
       FROM groups g
       WHERE g.group_type = 'thesis'
       ORDER BY g.group_name`
    );

    res.json({
      groups: result.rows.map(group => ({
        id: group.id,
        name: group.group_name,
        group_type: group.group_type,
        budget_goal: parseFloat(group.budget_goal),
        max_intra_loan_per_student: parseFloat(group.max_intra_loan_per_student),
        max_inter_loan_limit: parseFloat(group.max_inter_loan_limit),
        intra_loan_flat_fee: parseFloat(group.intra_loan_flat_fee),
        group_code: group.group_code,
        member_count: parseInt(group.member_count)
      }))
    });
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ error: 'Server error while fetching groups' });
  }
};

/**
 * Create a new group
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createGroup = async (req, res) => {
  try {
    // Only admin can access
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const { 
      group_name, 
      budget_goal, 
      max_intra_loan_per_student,
      max_inter_loan_limit,
      intra_loan_flat_fee
    } = req.body;

    if (!group_name) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    // Generate a unique 8-character alphanumeric code
    const generateCode = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed similar looking characters
      let code = '';
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    // Keep generating until we find a unique code
    let isUnique = false;
    let groupCode;

    while (!isUnique) {
      groupCode = generateCode();
      
      // Check if code already exists
      const existingCode = await db.query(
        'SELECT id FROM groups WHERE group_code = $1',
        [groupCode]
      );
      
      if (!existingCode.rows.length) {
        isUnique = true;
      }
    }

    // Create group
    const result = await db.query(
      `INSERT INTO groups (
        group_name, 
        budget_goal, 
        max_intra_loan_per_student,
        max_inter_loan_limit,
        intra_loan_flat_fee,
        group_code
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, group_name, budget_goal, max_intra_loan_per_student, 
                max_inter_loan_limit, intra_loan_flat_fee, group_code`,
      [
        group_name, 
        budget_goal || 0.00, 
        max_intra_loan_per_student || 100.00,
        max_inter_loan_limit || 500.00,
        intra_loan_flat_fee || 10.00,
        groupCode
      ]
    );

    res.json({
      message: 'Group created successfully',
      group: {
        id: result.rows[0].id,
        name: result.rows[0].group_name,
        budget_goal: parseFloat(result.rows[0].budget_goal),
        max_intra_loan_per_student: parseFloat(result.rows[0].max_intra_loan_per_student),
        max_inter_loan_limit: parseFloat(result.rows[0].max_inter_loan_limit),
        intra_loan_flat_fee: parseFloat(result.rows[0].intra_loan_flat_fee),
        group_code: result.rows[0].group_code
      }
    });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ error: 'Server error while creating group' });
  }
};

/**
 * Update a group (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateGroup = async (req, res) => {
  try {
    // Only admin can access
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const { id } = req.params;
    const {
      group_name,
      group_type,
      budget_goal,
      max_intra_loan_per_student,
      max_inter_loan_limit,
      intra_loan_flat_fee
    } = req.body;

    // Validate required fields
    if (!group_name || !group_type) {
      return res.status(400).json({ error: 'Group name and group type are required' });
    }

    // Update group
    const result = await db.query(
      `UPDATE groups SET
        group_name = $1,
        group_type = $2,
        budget_goal = $3,
        max_intra_loan_per_student = $4,
        max_inter_loan_limit = $5,
        intra_loan_flat_fee = $6
      WHERE id = $7
      RETURNING id, group_name, group_type, budget_goal, max_intra_loan_per_student, max_inter_loan_limit, intra_loan_flat_fee, group_code`,
      [
        group_name,
        group_type,
        budget_goal,
        max_intra_loan_per_student,
        max_inter_loan_limit,
        intra_loan_flat_fee,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }

    res.json({
      message: 'Group updated successfully',
      group: result.rows[0]
    });
  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({ error: 'Server error while updating group' });
  }
};

/**
 * Delete a group (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteGroup = async (req, res) => {
  try {
    // Only admin can access
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const { id } = req.params;

    const result = await db.query(
      `DELETE FROM groups WHERE id = $1 RETURNING id, group_name`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }

    res.json({
      message: 'Group deleted successfully',
      id: result.rows[0].id,
      group_name: result.rows[0].group_name
    });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({ error: 'Server error while deleting group' });
  }
};

/**
 * Create a new user (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createUser = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }
    const {
      first_name,
      middle_name,
      last_name,
      suffix,
      email,
      password,
      role,
      group_id
    } = req.body;

    // Validate required fields
    if (!first_name || !last_name || !email || !password || !role) {
      return res.status(400).json({ error: 'First name, last name, email, password, and role are required.' });
    }

    // Check for duplicate email
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered.' });
    }

    // Generate profile picture URL
    const profilePictureUrl = `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${encodeURIComponent(email)}`;

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Insert user
    const result = await db.query(
      `INSERT INTO users (
        first_name, middle_name, last_name, suffix, email, password_hash, role, group_id, profile_picture_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, first_name, middle_name, last_name, suffix, email, role, group_id, is_active, created_at, profile_picture_url`,
      [
        first_name,
        middle_name || null,
        last_name,
        suffix || null,
        email,
        password_hash,
        role,
        group_id || null,
        profilePictureUrl
      ]
    );

    const user = result.rows[0];
    res.status(201).json({
      message: 'User created successfully',
      user
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Server error while creating user' });
  }
};

/**
 * Delete a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteUser = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }
    const { userId } = req.params;
    const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted successfully', id: result.rows[0].id });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Server error while deleting user' });
  }
};

/**
 * Export the whole database as SQL or CSVs (admin only)
 * GET /api/admin/export-db?type=sql|csv
 */
const exportDatabase = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }
    const type = req.query.type || 'sql';
    if (type === 'sql') {
      // Use pg_dump to export the database
      const dbUrl = process.env.DATABASE_URL || process.env.PG_CONNECTION_STRING;
      if (!dbUrl) return res.status(500).json({ error: 'Database URL not configured' });
      res.setHeader('Content-Disposition', 'attachment; filename="thesis_db_export.sql"');
      res.setHeader('Content-Type', 'application/sql');
      console.log('Node PATH:', process.env.PATH);
      const dump = spawn('pg_dump', [dbUrl]);
      let errorOutput = '';
      dump.stderr.on('data', (data) => {
        errorOutput += data.toString();
        console.error('pg_dump error:', data.toString());
      });
      dump.stdout.pipe(res);
      dump.on('error', (err) => {
        res.status(500).end('pg_dump failed: ' + err.message);
      });
      dump.on('close', (code) => {
        if (code !== 0) {
          console.error('pg_dump exited with code', code, 'Error output:', errorOutput);
          if (!res.headersSent) {
            res.status(500).end('pg_dump exited with code ' + code + '\n' + errorOutput);
          }
        }
      });
      return;
    } else if (type === 'csv') {
      // Export all tables as CSVs and zip them
      const tablesResult = await db.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'`);
      const tables = tablesResult.rows.map(r => r.table_name);
      res.setHeader('Content-Disposition', 'attachment; filename="thesis_db_csv_export.zip"');
      res.setHeader('Content-Type', 'application/zip');
      const archive = archiver('zip');
      archive.pipe(res);
      for (const table of tables) {
        const result = await db.query(`SELECT * FROM ${table}`);
        const csvRows = [];
        if (result.rows.length > 0) {
          csvRows.push(Object.keys(result.rows[0]).join(','));
          for (const row of result.rows) {
            csvRows.push(Object.values(row).map(v => v === null ? '' : '"' + String(v).replace(/"/g, '""') + '"').join(','));
          }
        } else {
          // Add header only if table is empty
          const columnsRes = await db.query(`SELECT column_name FROM information_schema.columns WHERE table_name = $1`, [table]);
          csvRows.push(columnsRes.rows.map(c => c.column_name).join(','));
        }
        archive.append(csvRows.join(os.EOL), { name: `${table}.csv` });
      }
      await archive.finalize();
      return;
    } else {
      return res.status(400).json({ error: 'Invalid export type. Use type=sql or type=csv.' });
    }
  } catch (error) {
    console.error('Export database error:', error);
    res.status(500).json({ error: 'Server error during database export' });
  }
};

/**
 * Reset a user's password to a default value (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const resetUserPassword = async (req, res) => {
  try {
    // Only admin can access
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const { userId } = req.params;
    const defaultPassword = '@BSCS4Bank';

    // Check if user exists
    const userCheck = await db.query(
      'SELECT id, email FROM users WHERE id = $1',
      [userId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Hash the default password
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Update user password
    await db.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [hashedPassword, userId]
    );

    res.json({
      message: 'User password reset successfully',
      email: userCheck.rows[0].email
    });
  } catch (error) {
    console.error('Reset user password error:', error);
    res.status(500).json({ error: 'Server error while resetting user password' });
  }
};

module.exports = {
  getThesisWeeks,
  upsertThesisWeek,
  deleteThesisWeek,
  getUsers,
  updateUserRole,
  getGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  createUser,
  deleteUser,
  exportDatabase,
  resetUserPassword
};