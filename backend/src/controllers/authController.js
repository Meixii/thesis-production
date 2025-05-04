const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/db');
const { sendVerificationEmail } = require('../utils/email');
const nodemailer = require('nodemailer');

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
        id, email, first_name, middle_name, last_name, suffix,
        role, group_id, profile_picture_url, email_verified
       FROM users 
       WHERE id = $1`,
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

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Find user by email
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    
    // Always return success even if email doesn't exist (security best practice)
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If your email exists in our system, you will receive a password reset link'
      });
    }
    
    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Set token expiration (1 hour from now)
    const expires = new Date(Date.now() + 3600000);
    
    // Save token to database
    await db.query(
      'UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE id = $3',
      [token, expires, user.id]
    );
    
    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
    
    // Enhanced HTML email template
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Password Reset Request - Thesis Finance Tracker',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #f9f9f9;
              border-radius: 8px;
              padding: 25px;
              border: 1px solid #e1e1e1;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
            }
            .logo {
              font-size: 22px;
              font-weight: bold;
              color: #2563eb;
            }
            h1 {
              color: #1f2937;
              margin-bottom: 15px;
              font-size: 24px;
            }
            p {
              margin-bottom: 20px;
              color: #4b5563;
            }
            .button {
              display: inline-block;
              background-color: #2563eb;
              color: #ffffff;
              text-decoration: none;
              padding: 12px 24px;
              border-radius: 4px;
              font-weight: bold;
              margin: 15px 0;
              text-align: center;
            }
            .button:hover {
              background-color: #1d4ed8;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 12px;
              color: #6b7280;
            }
            .expiry {
              font-size: 14px;
              color: #dc2626;
              margin-top: 15px;
            }
            .divider {
              border-top: 1px solid #e5e7eb;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Thesis Finance Tracker</div>
            </div>
            <h1>Reset Your Password</h1>
            <p>Hello ${user.first_name || 'there'},</p>
            <p>We received a request to reset your password for your Thesis Finance Tracker account. Click the button below to set a new password:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            <p class="expiry">This link will expire in 1 hour.</p>
            <p>If you didn't request a password reset, you can safely ignore this email. Your account is secure.</p>
            <div class="divider"></div>
            <p>If the button above doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; font-size: 14px;"><a href="${resetUrl}" style="color: #2563eb;">${resetUrl}</a></p>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Zen Garden 2025 - Thesis Financial Tracker</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    await sendEmail(mailOptions);
    
    res.status(200).json({
      success: true,
      message: 'If your email exists in our system, you will receive a password reset link'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while processing your request',
      error: error.message
    });
  }
};

const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;
    
    // Find user with this token and check if token is still valid
    const result = await db.query(
      'SELECT * FROM users WHERE reset_password_token = $1 AND reset_password_expires > NOW()',
      [token]
    );
    
    const valid = result.rows.length > 0;
    
    res.status(200).json({
      success: true,
      valid
    });
  } catch (error) {
    console.error('Verify reset token error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while verifying the token',
      error: error.message
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    
    // Find user with this token and check if token is still valid
    const result = await db.query(
      'SELECT * FROM users WHERE reset_password_token = $1 AND reset_password_expires > NOW()',
      [token]
    );
    
    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Password reset token is invalid or has expired'
      });
    }
    
    const user = result.rows[0];
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update user password and clear reset token fields
    await db.query(
      'UPDATE users SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE id = $2',
      [hashedPassword, user.id]
    );
    
    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while resetting the password',
      error: error.message
    });
  }
};

const sendEmail = async (mailOptions) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD
    }
  });
  
  return transporter.sendMail(mailOptions);
};

module.exports = {
  login,
  register,
  verifyEmail,
  getProfile,
  resendVerificationEmail,
  forgotPassword,
  verifyResetToken,
  resetPassword
};