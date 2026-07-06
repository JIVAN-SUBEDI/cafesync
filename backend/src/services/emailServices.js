// const nodemailer = require('nodemailer');
// const logger = require('../utils/logger.js');

// class EmailService {
//   constructor() {
//     this.transporter = nodemailer.createTransport({
//       host: process.env.SMTP_HOST,
//       port: process.env.SMTP_PORT,
//       secure: process.env.SMTP_PORT === '465',
//       auth: {
//         user: process.env.SMTP_USER,
//         pass: process.env.SMTP_PASS
//       }
//     });
//   }

//   async sendEmail(to, subject, html, text = '') {
//     try {
//       const mailOptions = {
//         from: `"Hotel Management System" <${process.env.SMTP_USER}>`,
//         to,
//         subject,
//         text,
//         html
//       };

//       const info = await this.transporter.sendMail(mailOptions);
//       logger.info(`Email sent: ${info.messageId}`);
//       return true;
//     } catch (error) {
//       logger.error('Error sending email:', error);
//       return false;
//     }
//   }

//   async sendWelcomeEmail(to, name, hotelName) {
//     const subject = `Welcome to ${hotelName}'s Hotel Management System`;
//     const html = `
//       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//         <h2>Welcome to ${hotelName}'s Team!</h2>
//         <p>Hello ${name},</p>
//         <p>Your staff account has been created successfully.</p>
//         <p>You can now log in to the Hotel Management System using your email address.</p>
//         <p>If you have any questions, please contact your hotel administrator.</p>
//         <br>
//         <p>Best regards,</p>
//         <p>The Hotel Management System Team</p>
//       </div>
//     `;

//     return await this.sendEmail(to, subject, html);
//   }

//   async sendPasswordResetEmail(to, token) {
//     const subject = 'Password Reset Request';
//     const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
//     const html = `
//       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//         <h2>Password Reset Request</h2>
//         <p>We received a request to reset your password.</p>
//         <p>Click the link below to reset your password:</p>
//         <p><a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
//         <p>This link will expire in 1 hour.</p>
//         <p>If you didn't request a password reset, please ignore this email.</p>
//         <br>
//         <p>Best regards,</p>
//         <p>The Hotel Management System Team</p>
//       </div>
//     `;

//     return await this.sendEmail(to, subject, html);
//   }

//   async sendOrderConfirmation(to, order) {
//     const subject = `Order Confirmation - #${order.order_number}`;
//     const html = `
//       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//         <h2>Order Confirmation</h2>
//         <p>Thank you for your order!</p>
//         <p><strong>Order Number:</strong> ${order.order_number}</p>
//         <p><strong>Customer:</strong> ${order.customer_name}</p>
//         <p><strong>Table:</strong> ${order.table_number || 'Takeaway/Delivery'}</p>
//         <p><strong>Total Amount:</strong> $${order.total_amount}</p>
//         <p><strong>Status:</strong> ${order.status}</p>
//         <br>
//         <h3>Order Items:</h3>
//         <ul>
//           ${order.items.map(item => `
//             <li>${item.item_name} x${item.quantity} - $${item.total_price}</li>
//           `).join('')}
//         </ul>
//         <br>
//         <p>We'll notify you when your order is ready.</p>
//         <p>Best regards,</p>
//         <p>The Restaurant Team</p>
//       </div>
//     `;

//     return await this.sendEmail(to, subject, html);
//   }

//   async sendSubscriptionRenewalReminder(to, hotelName, daysRemaining) {
//     const subject = 'Subscription Renewal Reminder';
//     const html = `
//       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//         <h2>Subscription Renewal Reminder</h2>
//         <p>Hello ${hotelName} Administrator,</p>
//         <p>Your subscription will expire in ${daysRemaining} days.</p>
//         <p>Please renew your subscription to continue using our services without interruption.</p>
//         <p>You can renew your subscription from your hotel dashboard.</p>
//         <br>
//         <p>Best regards,</p>
//         <p>The Hotel Management System Team</p>
//       </div>
//     `;

//     return await this.sendEmail(to, subject, html);
//   }

//   async sendDailyReport(to, hotelName, reportData) {
//     const subject = `Daily Report - ${new Date().toLocaleDateString()}`;
//     const html = `
//       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//         <h2>Daily Report - ${hotelName}</h2>
//         <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
//         <br>
//         <h3>Summary:</h3>
//         <p><strong>Total Orders:</strong> ${reportData.totalOrders}</p>
//         <p><strong>Total Revenue:</strong> $${reportData.totalRevenue}</p>
//         <p><strong>Average Order Value:</strong> $${reportData.avgOrderValue}</p>
//         <p><strong>Most Popular Item:</strong> ${reportData.mostPopularItem}</p>
//         <br>
//         <h3>Top Items:</h3>
//         <ul>
//           ${reportData.topItems.map(item => `
//             <li>${item.name} - ${item.quantity} sold - $${item.revenue}</li>
//           `).join('')}
//         </ul>
//         <br>
//         <p>Best regards,</p>
//         <p>The Hotel Management System</p>
//       </div>
//     `;

//     return await this.sendEmail(to, subject, html);
//   }
// }

// module.exports = new EmailService();// src/services/emailService.js
const nodemailer = require("nodemailer");
const logger = require("../utils/logger");

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  /**
   * Send email helper method
   */
  async sendEmail(to, subject, html) {
    if (!to) {
      throw new Error("No recipients defined");
    }

    const mailOptions = {
      from: `"HotelEase" <${process.env.SMTP_FROM_EMAIL || "noreply@hotelease.com"}>`,
      to,
      subject,
      html,
    };

    const info = await this.transporter.sendMail(mailOptions);
    return info;
  }

  /**
   * Send OTP email to hotel admin
   * @param {Object} params
   * @param {string} params.to - Recipient email
   * @param {string} params.name - Recipient name
   * @param {string} params.otp - OTP code
   * @param {string} params.hotelName - Hotel name
   */
  async sendOTPEmail({ to, name, otp, hotelName }) {
    try {
      if (!to) {
        throw new Error("No recipients defined");
      }

      const subject = "Password Change OTP - HotelEase";
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9fafb;
            }
            .container {
              background: white;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 600;
            }
            .content {
              padding: 40px 30px;
            }
            .greeting {
              font-size: 18px;
              color: #1f2937;
              margin-bottom: 20px;
            }
            .otp-code {
              background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
              padding: 30px;
              text-align: center;
              margin: 30px 0;
              border-radius: 12px;
              border: 2px dashed #667eea;
            }
            .otp-code h2 {
              font-size: 48px;
              color: #667eea;
              margin: 0;
              letter-spacing: 8px;
              font-weight: bold;
            }
            .info-text {
              color: #6b7280;
              font-size: 14px;
              margin: 20px 0;
            }
            .warning {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 15px;
              margin-top: 30px;
              border-radius: 8px;
            }
            .warning p {
              margin: 0;
              color: #92400e;
              font-size: 14px;
            }
            .footer {
              background: #f3f4f6;
              padding: 20px;
              text-align: center;
              color: #6b7280;
              font-size: 12px;
              border-top: 1px solid #e5e7eb;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Change Request</h1>
            </div>
            <div class="content">
              <div class="greeting">
                <p>Hello <strong>${name || hotelName}</strong>,</p>
                <p>We received a request to change your password for <strong>${hotelName}</strong>.</p>
              </div>
              
              <p>Please use the following One-Time Password (OTP) to verify your identity:</p>
              
              <div class="otp-code">
                <h2>${otp}</h2>
              </div>
              
              <div class="info-text">
                <p>⏰ This OTP is valid for <strong>10 minutes</strong>.</p>
                <p>🔒 Never share this OTP with anyone, including HotelEase staff.</p>
              </div>
              
              <div class="warning">
                <p>⚠️ If you didn't request this password change, please ignore this email or contact our support team immediately.</p>
              </div>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} HotelEase. All rights reserved.</p>
              <p>This is an automated message, please do not reply to this email.</p>
              <p>Need help? Contact us at support@hotelease.com</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const info = await this.sendEmail(to, subject, html);
      logger.info("OTP email sent", { email: to, messageId: info.messageId });
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error("Failed to send OTP email", { error: error.message, email: to });
      throw error;
    }
  }

  /**
   * Send OTP to recovery email
   * @param {Object} params
   * @param {string} params.to - Recipient email
   * @param {string} params.name - Recipient name
   * @param {string} params.otp - OTP code
   * @param {string} params.hotelName - Hotel name
   * @param {string} params.adminEmail - Primary admin email
   */
  async sendRecoveryEmailOTP({ to, name, otp, hotelName, adminEmail }) {
    try {
      if (!to) {
        throw new Error("No recipients defined");
      }

      const subject = `🔐 Password Reset OTP - ${hotelName}`;
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9fafb;
            }
            .container {
              background: white;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 600;
            }
            .content {
              padding: 40px 30px;
            }
            .greeting {
              font-size: 18px;
              color: #1f2937;
              margin-bottom: 20px;
            }
            .info-box {
              background: #e0f2fe;
              border-left: 4px solid #0284c7;
              padding: 15px;
              margin: 20px 0;
              border-radius: 8px;
            }
            .info-box p {
              margin: 5px 0;
              color: #075985;
            }
            .otp-code {
              background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
              padding: 30px;
              text-align: center;
              margin: 30px 0;
              border-radius: 12px;
              border: 2px dashed #f59e0b;
            }
            .otp-code h2 {
              font-size: 48px;
              color: #f59e0b;
              margin: 0;
              letter-spacing: 8px;
              font-weight: bold;
            }
            .info-text {
              color: #6b7280;
              font-size: 14px;
              margin: 20px 0;
            }
            .warning {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 15px;
              margin-top: 30px;
              border-radius: 8px;
            }
            .warning p {
              margin: 0;
              color: #92400e;
              font-size: 14px;
            }
            .footer {
              background: #f3f4f6;
              padding: 20px;
              text-align: center;
              color: #6b7280;
              font-size: 12px;
              border-top: 1px solid #e5e7eb;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
              <div class="greeting">
                <p>Hello <strong>${name}</strong>,</p>
                <p>We received a request to reset the password for your hotel account at <strong>${hotelName}</strong>.</p>
              </div>
              
              <div class="info-box">
                <p><strong>📧 Recovery Email Notice:</strong></p>
                <p>Since you have a recovery email set up, we're sending this OTP to your recovery email address for enhanced security.</p>
                <p><strong>Primary Admin Email:</strong> ${adminEmail}</p>
              </div>
              
              <p>Please use the following One-Time Password (OTP) to verify your identity:</p>
              
              <div class="otp-code">
                <h2>${otp}</h2>
              </div>
              
              <div class="info-text">
                <p>⏰ This OTP is valid for <strong>10 minutes</strong>.</p>
                <p>🔒 Never share this OTP with anyone, including HotelEase staff.</p>
                <p>📧 This OTP was sent to your recovery email for security purposes.</p>
              </div>
              
              <div class="warning">
                <p>⚠️ If you didn't request this password change, please ignore this email or contact our support team immediately.</p>
              </div>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} HotelEase. All rights reserved.</p>
              <p>This is an automated message, please do not reply to this email.</p>
              <p>Need help? Contact us at support@hotelease.com</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const info = await this.sendEmail(to, subject, html);
      logger.info("Recovery email OTP sent", { email: to, messageId: info.messageId });
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error("Failed to send recovery email OTP", { error: error.message, email: to });
      throw error;
    }
  }

  /**
   * Send password change confirmation email
   * @param {Object} params
   * @param {string} params.to - Recipient email
   * @param {string} params.name - Recipient name
   * @param {boolean} params.isRecoveryEmail - Whether this is a recovery email
   * @param {string} params.adminEmail - Primary admin email (if recovery email)
   */
  async sendPasswordChangeConfirmation({ to, name, isRecoveryEmail = false, adminEmail = null }) {
    try {
      if (!to) {
        throw new Error("No recipients defined");
      }

      const subject = "✅ Password Changed Successfully - HotelEase";
      let extraMessage = "";

      if (isRecoveryEmail && adminEmail) {
        extraMessage = `
          <div class="info-box" style="background: #e0f2fe; border-left: 4px solid #0284c7; padding: 15px; margin: 20px 0; border-radius: 8px;">
            <p><strong>📧 Recovery Email Notice:</strong></p>
            <p>This confirmation was sent to your recovery email address.</p>
            <p>The password for your primary admin account (<strong>${adminEmail}</strong>) was changed.</p>
          </div>
        `;
      }

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9fafb;
            }
            .container {
              background: white;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 600;
            }
            .content {
              padding: 40px 30px;
            }
            .success-icon {
              text-align: center;
              font-size: 64px;
              margin-bottom: 20px;
            }
            .greeting {
              font-size: 18px;
              color: #1f2937;
              margin-bottom: 20px;
            }
            .warning {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 15px;
              margin: 20px 0;
              border-radius: 8px;
            }
            .warning p {
              margin: 0;
              color: #92400e;
            }
            .tips {
              background: #f3f4f6;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .tips h4 {
              margin: 0 0 10px 0;
              color: #1f2937;
            }
            .tips ul {
              margin: 0;
              padding-left: 20px;
            }
            .tips li {
              margin: 5px 0;
              color: #4b5563;
            }
            .footer {
              background: #f3f4f6;
              padding: 20px;
              text-align: center;
              color: #6b7280;
              font-size: 12px;
              border-top: 1px solid #e5e7eb;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Changed Successfully</h1>
            </div>
            <div class="content">
              <div class="success-icon">✅</div>
              <div class="greeting">
                <p>Hello <strong>${name}</strong>,</p>
                <p>Your hotel account password has been successfully changed.</p>
              </div>
              
              ${extraMessage}
              
              <div class="warning">
                <p><strong>⚠️ Didn't change your password?</strong></p>
                <p>If you didn't make this change, please contact our support team immediately as your account may be compromised.</p>
              </div>
              
              <div class="tips">
                <h4>🔒 Security Tips:</h4>
                <ul>
                  <li>Use a strong, unique password that you don't use elsewhere</li>
                  <li>Never share your password with anyone</li>
                  <li>Enable two-factor authentication if available</li>
                  <li>Regularly update your password for better security</li>
                </ul>
              </div>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} HotelEase. All rights reserved.</p>
              <p>This is an automated message, please do not reply to this email.</p>
              <p>Need help? Contact us at support@hotelease.com</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const info = await this.sendEmail(to, subject, html);
      logger.info("Password change confirmation email sent", { email: to, messageId: info.messageId });
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error("Failed to send confirmation email", { error: error.message, email: to });
      throw error;
    }
  }

  /**
   * Send trial welcome email
   * @param {Object} params
   * @param {string} params.to - Recipient email
   * @param {string} params.name - Recipient name
   * @param {string} params.hotelName - Hotel name
   * @param {Date|string} params.trialEndsAt - Trial end date
   * @param {string} params.planName - Plan name
   */
  async sendTrialWelcomeEmail({ to, name, hotelName, trialEndsAt, planName }) {
    try {
      if (!to) {
        throw new Error("No recipients defined");
      }

      const trialEndDate = new Date(trialEndsAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const subject = "🎉 Welcome to HotelEase - Your 14-Day Free Trial Awaits!";
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9fafb;
            }
            .container {
              background: white;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
              color: white;
              padding: 40px 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 32px;
              font-weight: 600;
            }
            .header p {
              margin: 10px 0 0;
              opacity: 0.9;
              font-size: 18px;
            }
            .content {
              padding: 40px 30px;
            }
            .welcome-message {
              font-size: 18px;
              color: #1f2937;
              margin-bottom: 30px;
            }
            .highlight-box {
              background: linear-gradient(135deg, #fef3c7 0%, #ffedd5 100%);
              border-left: 4px solid #f59e0b;
              padding: 25px;
              border-radius: 12px;
              margin: 30px 0;
            }
            .highlight-box h3 {
              color: #92400e;
              margin: 0 0 15px 0;
              font-size: 20px;
            }
            .trial-info {
              background: #f3f4f6;
              padding: 25px;
              border-radius: 12px;
              margin: 30px 0;
              text-align: center;
            }
            .trial-info .date {
              font-size: 24px;
              font-weight: bold;
              color: #f59e0b;
              margin: 10px 0;
            }
            .feature-list {
              list-style: none;
              padding: 0;
              margin: 20px 0;
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 15px;
            }
            .feature-list li {
              padding: 10px;
              background: #f9fafb;
              border-radius: 8px;
              display: flex;
              align-items: center;
              gap: 10px;
            }
            .feature-list li:before {
              content: "✓";
              color: #f59e0b;
              font-weight: bold;
              font-size: 18px;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
              color: white;
              text-decoration: none;
              padding: 15px 40px;
              border-radius: 8px;
              font-weight: 600;
              font-size: 16px;
              margin: 20px 0;
            }
            .button:hover {
              transform: translateY(-2px);
              box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
            }
            .footer {
              background: #f3f4f6;
              padding: 30px;
              text-align: center;
              color: #6b7280;
              font-size: 14px;
              border-top: 1px solid #e5e7eb;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to HotelEase, ${name}! 🎉</h1>
              <p>Your journey to smarter hotel management begins now</p>
            </div>
            
            <div class="content">
              <div class="welcome-message">
                <p>Dear <strong>${name}</strong>,</p>
                <p>Thank you for choosing HotelEase for <strong>${hotelName}</strong>. We're thrilled to have you on board and can't wait to see how our platform transforms your hotel management experience.</p>
              </div>

              <div class="trial-info">
                <h3 style="margin-top: 0;">Your 14-Day Free Trial</h3>
                <p style="font-size: 16px; color: #4b5563;">You're currently on the <strong>${planName}</strong> plan</p>
                <div class="date">${trialEndDate}</div>
                <p style="color: #6b7280; margin-bottom: 0;">Your trial ends on this date</p>
              </div>

              <div class="highlight-box">
                <h3>🚀 What's Included in Your Trial:</h3>
                <ul class="feature-list">
                  <li>Smart Order Management</li>
                  <li>Kitchen Display System</li>
                  <li>Table Management</li>
                  <li>Staff Management</li>
                  <li>Advanced Analytics</li>
                  <li>Mobile POS System</li>
                  <li>Inventory Management</li>
                  <li>Customer CRM</li>
                </ul>
              </div>

              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/hotel/${hotelName.toLowerCase().replace(/\s+/g, "-")}/dashboard" class="button">
                  Go to Your Dashboard →
                </a>
              </div>

              <div style="margin-top: 30px; padding: 20px; background: #e0f2fe; border-radius: 8px;">
                <h4 style="margin: 0 0 10px 0; color: #0369a1;">💡 Pro Tip</h4>
                <p style="margin: 0; color: #075985;">Set up your menu and table layout first. This will help you hit the ground running and make the most of your trial period.</p>
              </div>
            </div>

            <div class="footer">
              <p>Need help getting started? Our support team is here 24/7</p>
              <p>
                📧 <a href="mailto:support@hotelease.com" style="color: #f59e0b;">support@hotelease.com</a><br>
                📞 <a href="tel:+1234567890" style="color: #f59e0b;">+1 (234) 567-890</a>
              </p>
              <p style="margin-top: 20px; font-size: 12px;">
                © ${new Date().getFullYear()} HotelEase. All rights reserved.<br>
                This is an automated message, please do not reply to this email.
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      const info = await this.sendEmail(to, subject, html);
      logger.info("Trial welcome email sent", {
        to,
        hotelName,
        planName,
        messageId: info.messageId,
      });

      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error("Failed to send trial welcome email", {
        error: error.message,
        to,
        hotelName,
      });
      throw error;
    }
  }

  /**
   * Send subscription welcome email
   * @param {Object} params
   * @param {string} params.to - Recipient email
   * @param {string} params.name - Recipient name
   * @param {string} params.hotelName - Hotel name
   * @param {string} params.planName - Plan name
   * @param {number} params.amount - Subscription amount
   * @param {string} params.invoiceNumber - Invoice number
   */
  async sendSubscriptionWelcomeEmail({
    to,
    name,
    hotelName,
    planName,
    amount,
    invoiceNumber,
  }) {
    try {
      if (!to) {
        throw new Error("No recipients defined");
      }

      const formattedAmount = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);

      const subject = "🎊 Welcome to HotelEase Premium - Your Subscription is Active!";
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9fafb;
            }
            .container {
              background: white;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              padding: 40px 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 32px;
              font-weight: 600;
            }
            .header p {
              margin: 10px 0 0;
              opacity: 0.9;
              font-size: 18px;
            }
            .content {
              padding: 40px 30px;
            }
            .welcome-message {
              font-size: 18px;
              color: #1f2937;
              margin-bottom: 30px;
            }
            .invoice-box {
              background: #f3f4f6;
              padding: 25px;
              border-radius: 12px;
              margin: 30px 0;
              border: 1px solid #e5e7eb;
            }
            .invoice-details {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-top: 20px;
            }
            .invoice-item {
              padding: 10px;
              background: white;
              border-radius: 8px;
            }
            .invoice-item .label {
              color: #6b7280;
              font-size: 14px;
              margin-bottom: 5px;
            }
            .invoice-item .value {
              font-size: 18px;
              font-weight: bold;
              color: #059669;
            }
            .feature-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 15px;
              margin: 30px 0;
            }
            .feature-card {
              background: #f9fafb;
              padding: 20px;
              border-radius: 12px;
              border: 1px solid #e5e7eb;
            }
            .feature-card h4 {
              margin: 0 0 10px 0;
              color: #059669;
            }
            .feature-card p {
              margin: 0;
              color: #6b7280;
              font-size: 14px;
            }
            .badge {
              display: inline-block;
              background: #10b981;
              color: white;
              padding: 5px 10px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
              margin-bottom: 15px;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              text-decoration: none;
              padding: 15px 40px;
              border-radius: 8px;
              font-weight: 600;
              font-size: 16px;
              margin: 20px 0;
            }
            .button:hover {
              transform: translateY(-2px);
              box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
            }
            .footer {
              background: #f3f4f6;
              padding: 30px;
              text-align: center;
              color: #6b7280;
              font-size: 14px;
              border-top: 1px solid #e5e7eb;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to HotelEase Premium, ${name}! 🎊</h1>
              <p>Your subscription is now active</p>
            </div>
            
            <div class="content">
              <div class="welcome-message">
                <p>Dear <strong>${name}</strong>,</p>
                <p>Welcome to HotelEase Premium! Your subscription for <strong>${hotelName}</strong> is now active. You now have access to all premium features designed to take your hotel management to the next level.</p>
              </div>

              <div class="badge">🎯 PREMIUM SUBSCRIPTION ACTIVE</div>

              <div class="invoice-box">
                <h3 style="margin: 0 0 20px 0; color: #059669;">📄 Invoice Details</h3>
                <div class="invoice-details">
                  <div class="invoice-item">
                    <div class="label">Invoice Number</div>
                    <div class="value">${invoiceNumber}</div>
                  </div>
                  <div class="invoice-item">
                    <div class="label">Plan</div>
                    <div class="value">${planName}</div>
                  </div>
                  <div class="invoice-item">
                    <div class="label">Amount</div>
                    <div class="value">${formattedAmount}</div>
                  </div>
                  <div class="invoice-item">
                    <div class="label">Billing Period</div>
                    <div class="value">Annual</div>
                  </div>
                </div>
              </div>

              <h3 style="color: #1f2937;">✨ Premium Features Unlocked:</h3>
              <div class="feature-grid">
                <div class="feature-card">
                  <h4>🚀 Advanced Analytics</h4>
                  <p>Real-time insights and predictive analytics</p>
                </div>
                <div class="feature-card">
                  <h4>👥 Priority Support</h4>
                  <p>24/7 dedicated support team</p>
                </div>
                <div class="feature-card">
                  <h4>📊 Custom Reports</h4>
                  <p>Generate detailed business reports</p>
                </div>
                <div class="feature-card">
                  <h4>🔧 API Access</h4>
                  <p>Custom integrations with your tools</p>
                </div>
                <div class="feature-card">
                  <h4>🎨 White Label</h4>
                  <p>Custom branding options</p>
                </div>
                <div class="feature-card">
                  <h4>📱 Multi-device</h4>
                  <p>Access from anywhere, any device</p>
                </div>
              </div>

              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/hotel/${hotelName.toLowerCase().replace(/\s+/g, "-")}/dashboard" class="button">
                  Login to Access Your Dashboard →
                </a>
              </div>

              <div style="margin-top: 30px; padding: 20px; background: #d1fae5; border-radius: 8px;">
                <h4 style="margin: 0 0 10px 0; color: #065f46;">💳 Payment Information</h4>
                <p style="margin: 0; color: #065f46;">Your payment of ${formattedAmount} has been processed successfully. A detailed invoice has been sent to your email and is available in your dashboard.</p>
              </div>
            </div>

            <div class="footer">
              <p>Questions about your subscription? Our premium support team is here to help</p>
              <p>
                📧 <a href="mailto:premium@hotelease.com" style="color: #10b981;">premium@hotelease.com</a><br>
                📞 <a href="tel:+1234567890" style="color: #10b981;">+1 (234) 567-890</a>
              </p>
              <p style="margin-top: 20px; font-size: 12px;">
                © ${new Date().getFullYear()} HotelEase. All rights reserved.<br>
                Invoice: ${invoiceNumber}
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      const info = await this.sendEmail(to, subject, html);
      logger.info("Subscription welcome email sent", {
        to,
        hotelName,
        planName,
        invoiceNumber,
        messageId: info.messageId,
      });

      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error("Failed to send subscription welcome email", {
        error: error.message,
        to,
        hotelName,
        invoiceNumber,
      });
      throw error;
    }
  }
}

module.exports = new EmailService();