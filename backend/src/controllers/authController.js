const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/db');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/email');
const nodemailer = require('nodemailer');
const { uploadToCloudinary } = require('../utils/cloudinary');
const multer = require('multer');

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

    // Generate default profile picture URL using DiceBear
    const profilePictureUrl = `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${encodeURIComponent(email)}`;

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
        verification_token_expires,
        profile_picture_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
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
        verificationExpires,
        profilePictureUrl // Add the profile picture URL
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
    // Get email from request body instead of user ID from token
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Get user info by email
    const result = await db.query('SELECT id, email, email_verified FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    
    if (!user) {
      // Don't reveal that the user doesn't exist (security best practice)
      return res.status(200).json({ message: 'If your email exists in our system, a verification email will be sent.' });
    }
    
    if (user.email_verified) {
      return res.status(400).json({ error: 'Email already verified' });
    }
    
    // Generate new token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    await db.query(
      'UPDATE users SET verification_token = $1, verification_token_expires = $2 WHERE id = $3',
      [verificationToken, verificationExpires, user.id]
    );
    
    await sendVerificationEmail(user.email, verificationToken);
    
    res.json({ 
      success: true,
      message: 'Verification email sent.'
    });
  } catch (error) {
    console.error('Resend verification email error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error while resending verification email'
    });
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
    
    // Send password reset email using the utility function
    await sendPasswordResetEmail(user.email, token, user.first_name);
    
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

// Multer config for profile picture uploads
const profilePicUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

/**
 * Upload and update profile picture
 */
const uploadProfilePicture = async (req, res) => {
  try {
    const userId = req.user.userId;
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    // Get user's last name for filename
    const userResult = await db.query('SELECT last_name FROM users WHERE id = $1', [userId]);
    if (!userResult.rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }
    const lastName = userResult.rows[0].last_name || 'Unknown';
    // Upload to Cloudinary with profile picture filename and flag
    const uploadResult = await uploadToCloudinary(file, { profilePic: true, lastName });
    const url = uploadResult.secure_url;
    // Update user profile_picture_url
    await db.query('UPDATE users SET profile_picture_url = $1 WHERE id = $2', [url, userId]);
    res.json({ profilePictureUrl: url });
  } catch (error) {
    console.error('Profile picture upload error:', error);
    res.status(500).json({ error: 'Failed to upload profile picture' });
  }
};

/**
 * Update user's password
 * Requires authentication
 */
const updatePassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    // Get user's current password hash
    const result = await db.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [newPasswordHash, userId]
    );

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
};

// Update profile for all roles (student, finance_coordinator, admin)
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { firstName, middleName, lastName, suffix } = req.body;

    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'First name and last name are required' });
    }

    const result = await db.query(
      `UPDATE users 
       SET first_name = $1,
           middle_name = $2,
           last_name = $3,
           suffix = $4
       WHERE id = $5
       RETURNING id, first_name, middle_name, last_name, suffix, email, role, group_id, profile_picture_url, email_verified`,
      [firstName, middleName || null, lastName, suffix || null, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const user = result.rows[0];
    res.json({
      id: user.id,
      firstName: user.first_name,
      middleName: user.middle_name,
      lastName: user.last_name,
      suffix: user.suffix,
      email: user.email,
      role: user.role,
      groupId: user.group_id,
      profilePictureUrl: user.profile_picture_url,
      emailVerified: user.email_verified
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error while updating profile' });
  }
};

module.exports = {
  login,
  register,
  verifyEmail,
  getProfile,
  resendVerificationEmail,
  forgotPassword,
  verifyResetToken,
  resetPassword,
  updatePassword,
  uploadProfilePicture,
  profilePicUpload,
  updateProfile,
};