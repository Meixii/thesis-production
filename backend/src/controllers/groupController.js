const db = require('../config/db');

const createGroup = async (req, res) => {
  try {
    const {
      group_name,
      budget_goal = 0.00,
      max_intra_loan_per_student = 100.00,
      max_inter_loan_limit = 500.00,
      intra_loan_flat_fee = 10.00
    } = req.body;

    // Check if group name already exists
    const existingGroup = await db.query(
      'SELECT id FROM groups WHERE group_name = $1',
      [group_name]
    );

    if (existingGroup.rows[0]) {
      return res.status(400).json({ error: 'Group name already exists' });
    }

    // Create new group
    const result = await db.query(
      `INSERT INTO groups (
        group_name,
        budget_goal,
        max_intra_loan_per_student,
        max_inter_loan_limit,
        intra_loan_flat_fee
      ) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        group_name,
        budget_goal,
        max_intra_loan_per_student,
        max_inter_loan_limit,
        intra_loan_flat_fee
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ error: 'Server error during group creation' });
  }
};

const getGroup = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'SELECT * FROM groups WHERE id = $1',
      [id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Group not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({ error: 'Server error while fetching group' });
  }
};

module.exports = {
  createGroup,
  getGroup
}; 