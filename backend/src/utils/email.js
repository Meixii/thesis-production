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
        name: 'Mika from CSBank',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: 'Verify Your Email - CSBank',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              line-height: 1.6;
              color: #334155;
              background-color: #f8fafc;
              margin: 0;
              padding: 0;
            }
            
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 40px 20px;
            }
            
            .card {
              background-color: #ffffff;
              border-radius: 12px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 15px rgba(0, 0, 0, 0.03);
              padding: 40px;
              margin-bottom: 20px;
            }
            
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            
            .logo {
              font-size: 24px;
              font-weight: 700;
              color: #0f172a;
              margin-bottom: 8px;
              letter-spacing: -0.025em;
            }
            
            .logo-accent {
              color: #2563eb;
            }
            
            h1 {
              color: #0f172a;
              font-size: 22px;
              font-weight: 600;
              margin: 0 0 24px;
              letter-spacing: -0.025em;
            }
            
            p {
              margin: 0 0 24px;
              font-size: 16px;
            }
            
            .button {
              display: inline-block;
              background-color: #2563eb;
              color: #ffffff !important;
              text-decoration: none;
              padding: 12px 24px;
              border-radius: 8px;
              font-weight: 500;
              font-size: 16px;
              text-align: center;
              transition: background-color 0.2s;
            }
            
            .button:hover {
              background-color: #1d4ed8;
            }
            
            .link-container {
              margin: 24px 0;
              padding: 16px;
              background-color: #f1f5f9;
              border-radius: 8px;
              word-break: break-all;
            }
            
            .link {
              color: #2563eb;
              font-size: 14px;
              text-decoration: none;
            }
            
            .divider {
              height: 1px;
              background-color: #e2e8f0;
              margin: 32px 0;
            }
            
            .footer {
              text-align: center;
              color: #64748b;
              font-size: 14px;
              margin-top: 32px;
            }
            
            .note {
              font-size: 14px;
              color: #64748b;
              font-style: italic;
            }
            
            .icon {
              display: block;
              margin: 0 auto 24px;
              width: 48px;
              height: 48px;
            }
            
            @media only screen and (max-width: 480px) {
              .card {
                padding: 24px;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="header">
                <div class="logo">CS<span class="logo-accent">Bank</span></div>
                <svg class="icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#2563eb">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              
              <h1>Verify your email address</h1>
              <p>Thanks for signing up for CSBank! We're excited to have you as a member of our community. Please confirm your email address by clicking the button below:</p>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${verificationUrl}" class="button">Verify My Email</a>
              </div>
              
              <p class="note">This link will expire in 24 hours.</p>
              
              <div class="divider"></div>
              
              <p style="margin-bottom: 16px;">If the button above doesn't work, copy and paste this URL into your browser:</p>
              <div class="link-container">
                <a href="${verificationUrl}" class="link">${verificationUrl}</a>
              </div>
              
              <p class="note">If you didn't create an account with CSBank, you can safely ignore this email.</p>
            </div>
            
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} CSBank by Zen Garden. All rights reserved.</p>
              <p>Secure financial solutions for your future.</p>
            </div>
          </div>
        </body>
        </html>
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
        name: 'Mika from CSBank',
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
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              line-height: 1.6;
              color: #334155;
              background-color: #f8fafc;
              margin: 0;
              padding: 0;
            }
            
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 40px 20px;
            }
            
            .card {
              background-color: #ffffff;
              border-radius: 12px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 15px rgba(0, 0, 0, 0.03);
              padding: 40px;
              margin-bottom: 20px;
            }
            
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            
            .logo {
              font-size: 24px;
              font-weight: 700;
              color: #0f172a;
              margin-bottom: 8px;
              letter-spacing: -0.025em;
            }
            
            .logo-accent {
              color: #2563eb;
            }
            
            h1 {
              color: #0f172a;
              font-size: 22px;
              font-weight: 600;
              margin: 0 0 24px;
              letter-spacing: -0.025em;
            }
            
            p {
              margin: 0 0 24px;
              font-size: 16px;
            }
            
            .button {
              display: inline-block;
              background-color: #2563eb;
              color: #ffffff !important;
              text-decoration: none;
              padding: 12px 24px;
              border-radius: 8px;
              font-weight: 500;
              font-size: 16px;
              text-align: center;
              transition: background-color 0.2s;
            }
            
            .button:hover {
              background-color: #1d4ed8;
            }
            
            .link-container {
              margin: 24px 0;
              padding: 16px;
              background-color: #f1f5f9;
              border-radius: 8px;
              word-break: break-all;
            }
            
            .link {
              color: #2563eb;
              font-size: 14px;
              text-decoration: none;
            }
            
            .divider {
              height: 1px;
              background-color: #e2e8f0;
              margin: 32px 0;
            }
            
            .footer {
              text-align: center;
              color: #64748b;
              font-size: 14px;
              margin-top: 32px;
            }
            
            .note {
              font-size: 14px;
              color: #64748b;
              font-style: italic;
            }
            
            .expiry {
              color: #ef4444;
              font-weight: 500;
              font-size: 14px;
              margin: 24px 0;
            }
            
            .icon {
              display: block;
              margin: 0 auto 24px;
              width: 48px;
              height: 48px;
            }
            
            @media only screen and (max-width: 480px) {
              .card {
                padding: 24px;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="header">
                <div class="logo">CS<span class="logo-accent">Bank</span></div>
                <svg class="icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#2563eb">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              
              <h1>Reset your password</h1>
              <p>Hello ${firstName || 'there'},</p>
              <p>We received a request to reset the password for your CSBank account. Click the button below to create a new password:</p>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${resetUrl}" class="button">Reset My Password</a>
              </div>
              
              <p class="expiry">⚠️ This link will expire in 1 hour for security reasons.</p>
              
              <div class="divider"></div>
              
              <p style="margin-bottom: 16px;">If the button above doesn't work, copy and paste this URL into your browser:</p>
              <div class="link-container">
                <a href="${resetUrl}" class="link">${resetUrl}</a>
              </div>
              
              <p class="note">If you didn't request a password reset, please ignore this email or contact our support team if you have any concerns.</p>
            </div>
            
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} CSBank by Zen Garden. All rights reserved.</p>
              <p>Secure financial solutions for your future.</p>
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