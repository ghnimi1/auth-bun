import nodemailer from 'nodemailer';
import { env } from './env';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE === true,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"${env.EMAIL_FROM_NAME}" <${env.EMAIL_FROM}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('📧 Email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('❌ Email sending error:', error);
      return false;
    }
  }

  async sendOTPEmail(email: string, otp: string, name: string): Promise<boolean> {
    const subject = 'Your Verification Code';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .otp-code { 
            font-size: 32px; 
            font-weight: bold; 
            letter-spacing: 10px; 
            text-align: center; 
            margin: 30px 0;
            color: #4F46E5;
          }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          .warning { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Verification Code</h1>
          </div>
          <div class="content">
            <p>Hello ${name},</p>
            <p>Use the verification code below to complete your authentication:</p>
            
            <div class="otp-code">${otp}</div>
            
            <div class="warning">
              <p><strong>⚠️ Important:</strong></p>
              <p>• This code will expire in 10 minutes</p>
              <p>• Never share this code with anyone</p>
              <p>• If you didn't request this code, please ignore this email</p>
            </div>
            
            <p>If you're having trouble with the code, you can request a new one.</p>
            
            <p>Best regards,<br>The ${env.EMAIL_FROM_NAME} Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message, please do not reply to this email.</p>
            <p>© ${new Date().getFullYear()} ${env.EMAIL_FROM_NAME}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `Your verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this email.`;

    return this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  }

  async sendPasswordResetEmail(email: string, resetToken: string, name: string): Promise<boolean> {
    const resetLink = `${env.APP_URL}/reset-password?token=${resetToken}`;
    
    const subject = 'Password Reset Request';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #DC2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { 
            display: inline-block; 
            padding: 12px 30px; 
            background: #DC2626; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0;
          }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          .warning { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset</h1>
          </div>
          <div class="content">
            <p>Hello ${name},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            
            <div style="text-align: center;">
              <a href="${resetLink}" class="button">Reset Password</a>
            </div>
            
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 4px;">
              ${resetLink}
            </p>
            
            <div class="warning">
              <p><strong>⚠️ Important:</strong></p>
              <p>• This link will expire in 1 hour</p>
              <p>• If you didn't request this reset, please ignore this email</p>
              <p>• Your password will remain unchanged until you create a new one</p>
            </div>
            
            <p>Best regards,<br>The ${env.EMAIL_FROM_NAME} Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message, please do not reply to this email.</p>
            <p>© ${new Date().getFullYear()} ${env.EMAIL_FROM_NAME}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `Click this link to reset your password: ${resetLink}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this reset, please ignore this email.`;

    return this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  }

  async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    const subject = 'Welcome to Our App!';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome Aboard! 🎉</h1>
          </div>
          <div class="content">
            <p>Hello ${name},</p>
            <p>Welcome to ${env.EMAIL_FROM_NAME}! We're excited to have you on board.</p>
            
            <p>Your account has been successfully created. You can now:</p>
            <ul>
              <li>Log in to your account</li>
              <li>Access all our features</li>
              <li>Update your profile information</li>
              <li>Start using our services</li>
            </ul>
            
            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
            
            <p>Thank you for joining us!</p>
            
            <p>Best regards,<br>The ${env.EMAIL_FROM_NAME} Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message, please do not reply to this email.</p>
            <p>© ${new Date().getFullYear()} ${env.EMAIL_FROM_NAME}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
      text: `Welcome to ${env.EMAIL_FROM_NAME}, ${name}! Your account has been successfully created.`,
    });
  }
}

export const emailService = new EmailService();