const nodemailer = require('nodemailer');
require('dotenv').config();

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true, // use SSL
  auth: {
    user: process.env.EMAIL_USER, // your full email address
    pass: process.env.EMAIL_APP_PASSWORD // your email password
  },
  tls: {
    rejectUnauthorized: false // Only use this in development if needed
  }
});

// Add email verification
transporter.verify(function (error, success) {
  if (error) {
    console.log('SMTP server connection error:', error);
  } else {
    console.log('SMTP server connection successful');
  }
});

// Get the primary frontend URL (first URL in the list)
const getPrimaryFrontendUrl = () => {
  const urls = process.env.FRONTEND_URL.split(',');
  return urls[0].trim(); // Use the first URL and remove any whitespace
};

const sendVerificationEmail = async (email, token) => {
  try {
    const baseUrl = getPrimaryFrontendUrl();
    const verificationUrl = `${baseUrl}/verify-email/${token}`;

    const mailOptions = {
      from: {
        name: 'Mika',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: 'Verify Your Email - CSBank',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2C3E50;">CSBank</h1>
          </div>
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #2C3E50; margin-bottom: 20px;">Welcome!</h2>
            <p style="color: #34495E; font-size: 16px; line-height: 1.5;">Thank you for registering with CSBank. To ensure the security of your account, please verify your email address.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #3498DB; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
                Verify Email Address
              </a>
            </div>
            <p style="color: #7F8C8D; margin-top: 20px;">If the button doesn't work, copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #7F8C8D; background-color: #f8f9fa; padding: 10px; border-radius: 4px; font-size: 14px;">${verificationUrl}</p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #BDC3C7;">
              <p style="color: #7F8C8D; font-size: 14px;">This verification link will expire in 24 hours.</p>
              <p style="color: #7F8C8D; font-size: 14px;">If you didn't create an account, please ignore this email.</p>
            </div>
          </div>
          <div style="text-align: center; margin-top: 20px;">
            <p style="color: #95A5A6; font-size: 12px;">© ${new Date().getFullYear()} Zen Garden. All rights reserved.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Send verification email error:', error);
    throw error;
  }
};

const sendPasswordResetEmail = async (email, token) => {
  try {
    const baseUrl = getPrimaryFrontendUrl();
    const resetUrl = `${baseUrl}/reset-password/${token}`;

    const mailOptions = {
      from: {
        name: 'Mika',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: 'Reset Your Password - CSBank',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2C3E50;">CSBank</h1>
          </div>
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #2C3E50; margin-bottom: 20px;">Password Reset Request</h2>
            <p style="color: #34495E; font-size: 16px; line-height: 1.5;">We received a request to reset your password. Click the button below to create a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #3498DB; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
                Reset Password
              </a>
            </div>
            <p style="color: #7F8C8D; margin-top: 20px;">If the button doesn't work, copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #7F8C8D; background-color: #f8f9fa; padding: 10px; border-radius: 4px; font-size: 14px;">${resetUrl}</p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #BDC3C7;">
              <p style="color: #7F8C8D; font-size: 14px;">This reset link will expire in 1 hour.</p>
              <p style="color: #7F8C8D; font-size: 14px;">If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
            </div>
          </div>
          <div style="text-align: center; margin-top: 20px;">
            <p style="color: #95A5A6; font-size: 12px;">© ${new Date().getFullYear()} Zen Garden. All rights reserved.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Send password reset email error:', error);
    throw error;
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail
};