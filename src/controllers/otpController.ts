import type { Request, Response } from 'express';
import { OTPService } from '../services/otpService';
import { User } from '../models/user';
import { generateTokens, sanitizeUser } from '../utils/helpers';
import { Logger } from '../utils/logger';
import { body, validationResult } from 'express-validator';
import type { AuthRequest } from '../middleware/auth';

export class OTPController {
  // Send OTP for email verification (after registration)
  static async sendVerificationOTP(req: AuthRequest, res: Response): Promise<void> {
    try {
      const email = req.user?.email || req.body.email;

      if (!email) {
        res.status(400).json({ error: 'Email is required' });
        return;
      }

      const result = await OTPService.sendOTP(email, 'verification');

      if (!result.success) {
        res.status(400).json({ error: result.message });
        return;
      }

      res.json({
        success: true,
        message: result.message,
        expiry: result.expiry,
        // Only include OTP in development for testing
        ...(process.env.NODE_ENV === 'development' && { otp: result.otp }),
      });
    } catch (error: any) {
      Logger.error('Send verification OTP error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Send OTP for login
  static async sendLoginOTP(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({ error: 'Email is required' });
        return;
      }

      const result = await OTPService.sendOTP(email, 'login');

      if (!result.success) {
        res.status(400).json({ error: result.message });
        return;
      }

      res.json({
        success: true,
        message: result.message,
        expiry: result.expiry,
        // Only include OTP in development for testing
        ...(process.env.NODE_ENV === 'development' && { otp: result.otp }),
      });
    } catch (error: any) {
      Logger.error('Send login OTP error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Verify OTP for email verification
  static async verifyEmailOTP(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { otp } = req.body;
      const email = req.user?.email;

      if (!email || !otp) {
        res.status(400).json({ error: 'Email and OTP are required' });
        return;
      }

      const result = await OTPService.verifyOTP(email, otp, 'verification');

      if (!result.success) {
        res.status(400).json({ error: result.message });
        return;
      }

      // Generate tokens
      const tokens = generateTokens(result.user._id.toString());

      res.json({
        success: true,
        message: result.message,
        user: result.user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
    } catch (error: any) {
      Logger.error('Verify email OTP error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Verify OTP for login
  static async verifyLoginOTP(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        res.status(400).json({ error: 'Email and OTP are required' });
        return;
      }

      const result = await OTPService.verifyOTP(email, otp, 'login');

      if (!result.success) {
        res.status(400).json({ error: result.message });
        return;
      }

      res.json({
        success: true,
        message: result.message,
        user: result.user,
        token: result.token,
      });
    } catch (error: any) {
      Logger.error('Verify login OTP error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Resend OTP
  static async resendOTP(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({ error: 'Email is required' });
        return;
      }

      const result = await OTPService.resendOTP(email);

      if (!result.success) {
        res.status(400).json({ error: result.message });
        return;
      }

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      Logger.error('Resend OTP error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Request password reset
  static async requestPasswordReset(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({ error: 'Email is required' });
        return;
      }

      const result = await OTPService.generatePasswordResetToken(email);

      if (!result.success) {
        res.status(400).json({ error: result.message });
        return;
      }

      res.json({
        success: true,
        message: result.message,
        // Only include token in development for testing
        ...(process.env.NODE_ENV === 'development' && { resetToken: result.resetToken }),
      });
    } catch (error: any) {
      Logger.error('Request password reset error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Reset password with token
  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        res.status(400).json({ error: 'Token and new password are required' });
        return;
      }

      // Validate password strength
      if (newPassword.length < 8) {
        res.status(400).json({ error: 'Password must be at least 8 characters' });
        return;
      }

      const result = await OTPService.resetPasswordWithToken(token, newPassword);

      if (!result.success) {
        res.status(400).json({ error: result.message });
        return;
      }

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      Logger.error('Reset password error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Validate reset token
  static async validateResetToken(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.body;

      if (!token) {
        res.status(400).json({ error: 'Token is required' });
        return;
      }

      const result = await OTPService.validateResetToken(token);

      if (!result.valid) {
        res.status(400).json({ error: result.message });
        return;
      }

      res.json({
        success: true,
        message: result.message,
        email: result.email,
      });
    } catch (error: any) {
      Logger.error('Validate reset token error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Send OTP for 2FA (Two-Factor Authentication)
  static async send2FAOTP(req: AuthRequest, res: Response): Promise<void> {
    try {
      const email = req.user?.email;

      if (!email) {
        res.status(400).json({ error: 'User not authenticated' });
        return;
      }

      const result = await OTPService.sendOTP(email, 'login');

      if (!result.success) {
        res.status(400).json({ error: result.message });
        return;
      }

      res.json({
        success: true,
        message: result.message,
        expiry: result.expiry,
        // Only include OTP in development for testing
        ...(process.env.NODE_ENV === 'development' && { otp: result.otp }),
      });
    } catch (error: any) {
      Logger.error('Send 2FA OTP error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Verify 2FA OTP
  static async verify2FAOTP(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { otp } = req.body;
      const email = req.user?.email;

      if (!email || !otp) {
        res.status(400).json({ error: 'OTP is required' });
        return;
      }

      const result = await OTPService.verifyOTP(email, otp, 'login');

      if (!result.success) {
        res.status(400).json({ error: result.message });
        return;
      }

      // Generate tokens
      const tokens = generateTokens(req.user._id.toString());

      res.json({
        success: true,
        message: result.message,
        user: sanitizeUser(req.user),
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
    } catch (error: any) {
      Logger.error('Verify 2FA OTP error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Check OTP status
  static async checkOTPStatus(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({ error: 'Email is required' });
        return;
      }

      const user = await User.findOne({ email }).select('+otpAttempts +otpBlockedUntil +isEmailVerified');

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const isBlocked = user.isOTPBlocked();
      const blockedUntil = user.otpBlockedUntil;
      const remainingTime = blockedUntil ? Math.ceil((blockedUntil.getTime() - Date.now()) / 60000) : 0;

      res.json({
        success: true,
        data: {
          isEmailVerified: user.isEmailVerified,
          isOTPBlocked: isBlocked,
          otpAttempts: user.otpAttempts,
          remainingAttempts: Math.max(0, 5 - user.otpAttempts),
          blockedUntil: blockedUntil,
          remainingBlockTime: isBlocked ? remainingTime : 0,
        },
      });
    } catch (error: any) {
      Logger.error('Check OTP status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

// Validation middleware
export const otpValidation = {
  sendOTP: [
    body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  ],
  verifyOTP: [
    body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
    body('otp')
      .isLength({ min: 6, max: 6 })
      .withMessage('OTP must be 6 digits')
      .matches(/^\d+$/)
      .withMessage('OTP must contain only digits'),
  ],
  resetPassword: [
    body('token').notEmpty().withMessage('Token is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  ],
};