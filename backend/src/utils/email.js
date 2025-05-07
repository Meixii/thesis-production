const nodemailer = require('nodemailer');
require('dotenv').config();

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true, // use SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
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

const sendPasswordResetEmail = async (email, token, firstName) => {
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
              <div class="logo">CSBank</div>
            </div>
            <h1>Reset Your Password</h1>
            <p>Hello ${firstName || 'there'},</p>
            <p>We received a request to reset your password for your CSBank account. Click the button below to set a new password:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            <p class="expiry">This link will expire in 1 hour.</p>
            <p>If you didn't request a password reset, you can safely ignore this email. Your account is secure.</p>
            <div class="divider"></div>
            <p>If the button above doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; font-size: 14px;"><a href="${resetUrl}" style="color: #2563eb;">${resetUrl}</a></p>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Zen Garden. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
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