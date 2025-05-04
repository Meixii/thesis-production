const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/db');
const { sendVerificationEmail } = require('../utils/email');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const result = await db.query(
      'SELECT id, email, password_hash, first_name, last_name, role, group_id, email_verified FROM users WHERE email = $1',
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid login credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid login credentials' });
    }

    if (!user.email_verified) {
      return res.status(401).json({ error: 'Please verify your email address before logging in' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        role: user.role,
        groupId: user.group_id
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return user info and token
    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        groupId: user.group_id,
        emailVerified: user.email_verified
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

const register = async (req, res) => {
  try {
    const {
      firstName,
      middleName,
      lastName,
      suffix,
      email,
      password,
      ssoProvider,
      ssoId
    } = req.body;

    // Check if user already exists
    const existingUser = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows[0]) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Hash password for traditional registration
    const passwordHash = ssoProvider ? null : await bcrypt.hash(password, 10);

    // Insert new user
    const result = await db.query(
      `INSERT INTO users (
        first_name,
        middle_name,
        last_name,
        suffix,
        email,
        password_hash,
        role,
        ${ssoProvider === 'facebook' ? 'facebook_id' : ssoProvider === 'google' ? 'google_id' : 'email_verified'},
        verification_token,
        verification_token_expires
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        firstName,
        middleName || null,
        lastName,
        suffix || null,
        email,
        passwordHash,
        'student',
        ssoProvider ? ssoId : false,
        verificationToken,
        verificationExpires
      ]
    );

    const user = result.rows[0];

    // For traditional registration, send verification email
    if (!ssoProvider) {
      await sendVerificationEmail(email, verificationToken);
      return res.status(201).json({
        message: 'Registration successful. Please check your email for verification.'
      });
    }

    // For SSO registration, create and return token
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        role: user.role,
        groupId: user.group_id
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        groupId: user.group_id
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const result = await db.query(
      `UPDATE users 
       SET email_verified = true, 
           verification_token = null, 
           verification_token_expires = null 
       WHERE verification_token = $1 
       AND verification_token_expires > NOW() 
       RETURNING id`,
      [token]
    );

    if (!result.rows[0]) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    res.json({ message: 'Email verified successfully. You can now log in.' });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Server error during email verification' });
  }
};

const getProfile = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
        u.id, u.email, u.first_name, u.middle_name, u.last_name, u.suffix,
        u.role, u.group_id, u.profile_picture_url, u.email_verified,
        g.group_name
       FROM users u
       LEFT JOIN groups g ON u.group_id = g.id
       WHERE u.id = $1`,
      [req.user.userId]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      middleName: user.middle_name,
      lastName: user.last_name,
      suffix: user.suffix,
      role: user.role,
      groupId: user.group_id,
      groupName: user.group_name,
      profilePictureUrl: user.profile_picture_url,
      emailVerified: user.email_verified
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error while fetching profile' });
  }
};

const resendVerificationEmail = async (req, res) => {
  try {
    const userId = req.user.userId;
    // Get user info
    const result = await db.query('SELECT email, email_verified FROM users WHERE id = $1', [userId]);
    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.email_verified) {
      return res.status(400).json({ error: 'Email already verified' });
    }
    // Generate new token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await db.query(
      'UPDATE users SET verification_token = $1, verification_token_expires = $2 WHERE id = $3',
      [verificationToken, verificationExpires, userId]
    );
    await sendVerificationEmail(user.email, verificationToken);
    res.json({ message: 'Verification email sent.' });
  } catch (error) {
    console.error('Resend verification email error:', error);
    res.status(500).json({ error: 'Server error while resending verification email' });
  }
};

module.exports = {
  login,
  register,
  verifyEmail,
  getProfile,
  resendVerificationEmail
}; 