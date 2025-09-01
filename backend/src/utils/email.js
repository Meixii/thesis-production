const nodemailer = require('nodemailer');
require('dotenv').config();

// // Create reusable transporter object using SMTP transport
// const transporter = nodemailer.createTransport({
//   host: 'smtp.hostinger.com',
//   port: 465,
//   secure: true, // use SSL
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_APP_PASSWORD
//   },
//   tls: {
//     rejectUnauthorized: false // Only use this in development if needed
//   }
// });

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
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

// Base email template
const getBaseEmailTemplate = (content) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>CSBank Notification</title>
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
          border: 1px solid #e5e7eb;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        
        .logo {
          font-size: 28px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 8px;
          letter-spacing: -0.025em;
        }
        
        .logo-accent {
          color: #2563eb;
          text-shadow: 0 0 8px rgba(37, 99, 235, 0.3);
        }
        
        h1 {
          color: #0f172a;
          font-size: 24px;
          font-weight: 600;
          margin: 0 0 24px;
          letter-spacing: -0.025em;
        }
        
        p {
          margin: 0 0 24px;
          font-size: 16px;
          line-height: 1.7;
        }
        
        .button {
          display: inline-block;
          background-color: #2563eb;
          color: #ffffff !important;
          text-decoration: none;
          padding: 14px 28px;
          border-radius: 8px;
          font-weight: 500;
          font-size: 16px;
          text-align: center;
          transition: background-color 0.2s;
          box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
        }
        
        .button:hover {
          background-color: #1d4ed8;
        }
        
        .button-secondary {
          background-color: #6b7280;
        }
        
        .button-secondary:hover {
          background-color: #4b5563;
        }
        
        .amount-box {
          background-color: #eff6ff;
          border: 2px solid #dbeafe;
          border-radius: 8px;
          padding: 20px;
          margin: 24px 0;
          text-align: center;
        }
        
        .amount {
          font-size: 32px;
          font-weight: 700;
          color: #1e40af;
          margin: 0;
        }
        
        .amount-label {
          font-size: 14px;
          color: #64748b;
          margin-top: 4px;
        }
        
        .info-box {
          background-color: #f3f4f6;
          border-radius: 8px;
          padding: 20px;
          margin: 24px 0;
        }
        
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .info-row:last-child {
          border-bottom: none;
        }
        
        .info-label {
          color: #64748b;
          font-size: 14px;
        }
        
        .info-value {
          color: #0f172a;
          font-weight: 500;
          font-size: 14px;
        }
        
        .alert-box {
          background-color: #fef3c7;
          border: 1px solid #fcd34d;
          border-radius: 8px;
          padding: 16px;
          margin: 24px 0;
          display: flex;
          align-items: start;
          gap: 12px;
        }
        
        .alert-icon {
          flex-shrink: 0;
          width: 20px;
          height: 20px;
        }
        
        .alert-text {
          color: #92400e;
          font-size: 14px;
          margin: 0;
        }
        
        .success-box {
          background-color: #d1fae5;
          border: 1px solid #6ee7b7;
          border-radius: 8px;
          padding: 16px;
          margin: 24px 0;
          display: flex;
          align-items: start;
          gap: 12px;
        }
        
        .success-icon {
          flex-shrink: 0;
          width: 20px;
          height: 20px;
        }
        
        .success-text {
          color: #065f46;
          font-size: 14px;
          margin: 0;
        }
        
        .error-box {
          background-color: #fee2e2;
          border: 1px solid #fca5a5;
          border-radius: 8px;
          padding: 16px;
          margin: 24px 0;
          display: flex;
          align-items: start;
          gap: 12px;
        }
        
        .error-icon {
          flex-shrink: 0;
          width: 20px;
          height: 20px;
        }
        
        .error-text {
          color: #991b1b;
          font-size: 14px;
          margin: 0;
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
        
        .footer p {
          margin: 4px 0;
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
          
          .amount {
            font-size: 28px;
          }
          
          .info-row {
            flex-direction: column;
            gap: 4px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="header">
            <div class="logo">CS<span class="logo-accent">Bank</span></div>
          </div>
          ${content}
          <div class="divider"></div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} CSBank by Zen Garden. All rights reserved.</p>
            <p>I finally fixed the email :)</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Notification email templates
const getNotificationTemplate = (type, data) => {
  switch (type) {
    case 'due_created':
      return `
        <svg class="icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#2563eb">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
        
        <h1>New Due Created</h1>
        <p>Hello ${data.userName},</p>
        <p>A new due has been created by ${data.creatorName} for your group.</p>
        
        <div class="amount-box">
          <p class="amount">₱${data.amount.toFixed(2)}</p>
          <p class="amount-label">${data.dueTitle}</p>
        </div>
        
        <div class="info-box">
          <div class="info-row">
            <span class="info-label">Due Date: </span>
            <span class="info-value"> ${new Date(data.dueDate).toLocaleDateString()}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Created By: </span>
            <span class="info-value"> ${data.creatorName}</span>
          </div>
        </div>
        
        <div class="alert-box">
          <svg class="alert-icon" fill="#f59e0b" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
          </svg>
          <p class="alert-text">Please make sure to pay before the due date to avoid penalties.</p>
        </div>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${getPrimaryFrontendUrl()}/dashboard" class="button">View Due Details</a>
        </div>
      `;
      
    case 'payment_verified':
      return `
        <svg class="icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#10b981">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        
        <h1>Payment Verified</h1>
        <p>Hello ${data.userName},</p>
        <p>Great news! Your payment has been successfully verified.</p>
        
        <div class="success-box">
          <svg class="success-icon" fill="#10b981" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          <p class="success-text">Your payment has been confirmed and recorded in the system.</p>
        </div>
        
        <div class="info-box">
          <div class="info-row">
            <span class="info-label">Amount Paid: </span>
            <span class="info-value"> ₱${data.amount.toFixed(2)}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Due Title: </span>
            <span class="info-value"> ${data.dueTitle}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Payment Method: </span>
            <span class="info-value"> ${data.paymentMethod.toUpperCase()}</span>
          </div>
        </div>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${getPrimaryFrontendUrl()}/dashboard" class="button">View Payment History</a>
        </div>
      `;
      
    case 'payment_rejected':
      return `
        <svg class="icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#ef4444">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        
        <h1>Payment Rejected</h1>
        <p>Hello ${data.userName},</p>
        <p>Unfortunately, your payment has been rejected by the treasurer.</p>
        
        <div class="error-box">
          <svg class="error-icon" fill="#ef4444" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
          <p class="error-text">${data.rejectionReason}</p>
        </div>
        
        <div class="info-box">
          <div class="info-row">
            <span class="info-label">Amount: </span>
            <span class="info-value"> ₱${data.amount.toFixed(2)}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Due Title: </span>
            <span class="info-value"> ${data.dueTitle}</span>
          </div>
        </div>
        
        <p>Please review the rejection reason and submit a new payment with the correct information.</p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${getPrimaryFrontendUrl()}/payment" class="button">Submit New Payment</a>
        </div>
      `;
      
    case 'due_reminder':
      return `
        <svg class="icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#f59e0b">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        <h1>Due Date Reminder</h1>
        <p>Hello ${data.userName},</p>
        <p>This is a friendly reminder about an upcoming due date.</p>
        
        <div class="alert-box">
          <svg class="alert-icon" fill="#f59e0b" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
          </svg>
          <p class="alert-text">Due in ${data.daysUntilDue} days!</p>
        </div>
        
        <div class="amount-box">
          <p class="amount">₱${data.amount.toFixed(2)}</p>
          <p class="amount-label">${data.dueTitle}</p>
        </div>
        
        <div class="info-box">
          <div class="info-row">
            <span class="info-label">Due Date: </span>
            <span class="info-value"> ${new Date(data.dueDate).toLocaleDateString()}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Days Remaining: </span>
            <span class="info-value"> ${data.daysUntilDue} days</span>
          </div>
        </div>
        
        <p>Please ensure you make your payment before the due date to avoid any penalties.</p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${getPrimaryFrontendUrl()}/payment" class="button">Pay Now</a>
        </div>
      `;
      
    default:
      return `
        <h1>Notification</h1>
        <p>${data.message || 'You have a new notification from CSBank.'}</p>
      `;
  }
};

const sendVerificationEmail = async (email, token) => {
  try {
    const baseUrl = getPrimaryFrontendUrl();
    const verificationUrl = `${baseUrl}/verify-email/${token}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
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
              <p>I finally fixed the email :)</p>
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
      from: process.env.EMAIL_USER,
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
              <p>I finally fixed the email :)</p>
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

const sendNotificationEmail = async ({ to, subject, type, data }) => {
  try {
    const content = getNotificationTemplate(type, data);
    const html = getBaseEmailTemplate(content);
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Send notification email error:', error);
    throw error;
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendNotificationEmail
};