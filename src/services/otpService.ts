import { User } from '../models/user';
import { OTPGenerator } from '../utils/otpGenerator';
import { emailService } from '../config/email';
import { Logger } from '../utils/logger';

export class OTPService {
  // Send OTP to user's email
  static async sendOTP(email: string, purpose: 'verification' | 'login' | 'reset' = 'verification'): Promise<{
    success: boolean;
    message: string;
    otp?: string;
    expiry?: Date;
  }> {
    try {
      // Find user
      const user = await User.findOne({ email }).select('+otp +otpExpiry +otpAttempts +otpBlockedUntil');
      
      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      // Check if user is active
      if (!user.isActive) {
        return {
          success: false,
          message: 'Account is inactive',
        };
      }

      // Check if OTP attempts are blocked
      if (user.isOTPBlocked()) {
        const blockedUntil = user.otpBlockedUntil;
        const remainingTime = blockedUntil ? Math.ceil((blockedUntil.getTime() - Date.now()) / 60000) : 0;
        
        return {
          success: false,
          message: `Too many OTP attempts. Please try again in ${remainingTime} minutes.`,
        };
      }

      // Generate OTP
      const otp = OTPGenerator.generateNumeric();
      const otpExpiry = OTPGenerator.getExpiryTime();

      // Save OTP to user
      user.otp = otp;
      user.otpExpiry = otpExpiry;
      await user.save();

      // Send email
      let subject = 'Verification Code';
      if (purpose === 'login') subject = 'Login Verification Code';
      if (purpose === 'reset') subject = 'Password Reset Code';

      const emailSent = await emailService.sendOTPEmail(email, otp, user.name);

      if (!emailSent) {
        return {
          success: false,
          message: 'Failed to send OTP email',
        };
      }

      Logger.info(`OTP sent to ${email} for ${purpose}: ${otp}`);

      return {
        success: true,
        message: 'OTP sent successfully',
        otp: process.env.NODE_ENV === 'development' ? otp : undefined, // Only return OTP in dev
        expiry: otpExpiry,
      };
    } catch (error: any) {
      Logger.error('Send OTP error:', error);
      return {
        success: false,
        message: 'Failed to send OTP',
      };
    }
  }

  // Verify OTP
  static async verifyOTP(email: string, otp: string, purpose: 'verification' | 'login' | 'reset' = 'verification'): Promise<{
    success: boolean;
    message: string;
    user?: any;
    token?: string;
  }> {
    try {
      // Find user with OTP fields
      const user = await User.findOne({ email }).select('+otp +otpExpiry +otpAttempts +otpBlockedUntil +password');

      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      // Check if OTP attempts are blocked
      if (user.isOTPBlocked()) {
        const blockedUntil = user.otpBlockedUntil;
        const remainingTime = blockedUntil ? Math.ceil((blockedUntil.getTime() - Date.now()) / 60000) : 0;
        
        return {
          success: false,
          message: `Too many OTP attempts. Please try again in ${remainingTime} minutes.`,
        };
      }

      // Check if OTP exists and matches
      if (!user.otp || user.otp !== otp) {
        // Increment failed attempts
        await user.incrementOTPAttempts();
        
        const remainingAttempts = 5 - user.otpAttempts;
        
        return {
          success: false,
          message: remainingAttempts > 0 
            ? `Invalid OTP. ${remainingAttempts} attempts remaining.`
            : 'Too many failed attempts. Account temporarily locked.',
        };
      }

      // Check if OTP is expired
      if (!user.otpExpiry || OTPGenerator.isExpired(user.otpExpiry)) {
        // Clear OTP
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        return {
          success: false,
          message: 'OTP has expired. Please request a new one.',
        };
      }

      // OTP is valid
      
      // Clear OTP and reset attempts
      user.otp = undefined;
      user.otpExpiry = undefined;
      await user.resetOTPAttempts();

      // Update user based on purpose
      if (purpose === 'verification') {
        user.isEmailVerified = true;
        await user.save();
        
        // Send welcome email
        await emailService.sendWelcomeEmail(email, user.name);
      }

      if (purpose === 'login') {
        user.lastLogin = new Date();
        await user.save();
      }

      Logger.info(`OTP verified for ${email} for ${purpose}`);

      // Generate JWT token for login/verification
      let token: string | undefined;
      if (purpose === 'login' || purpose === 'verification') {
        const jwt = require('jsonwebtoken');
        const { env } = require('../config/env');
        
        token = jwt.sign(
          { userId: user._id, email: user.email },
          env.JWT_SECRET,
          { expiresIn: env.JWT_EXPIRES_IN }
        );
      }

      return {
        success: true,
        message: 'OTP verified successfully',
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          isEmailVerified: user.isEmailVerified,
        },
        token,
      };
    } catch (error: any) {
      Logger.error('Verify OTP error:', error);
      return {
        success: false,
        message: 'Failed to verify OTP',
      };
    }
  }

  // Resend OTP
  static async resendOTP(email: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const user = await User.findOne({ email }).select('+otpExpiry');

      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      // Check if we should wait before resending
      if (user.otpExpiry) {
        const timeSinceLastOTP = Date.now() - user.otpExpiry.getTime();
        const minResendTime = 60 * 1000; // 1 minute in milliseconds

        if (timeSinceLastOTP < minResendTime && timeSinceLastOTP > 0) {
          const waitTime = Math.ceil((minResendTime - timeSinceLastOTP) / 1000);
          return {
            success: false,
            message: `Please wait ${waitTime} seconds before requesting a new OTP`,
          };
        }
      }

      // Send new OTP
      return await this.sendOTP(email);
    } catch (error: any) {
      Logger.error('Resend OTP error:', error);
      return {
        success: false,
        message: 'Failed to resend OTP',
      };
    }
  }

  // Generate password reset token
  static async generatePasswordResetToken(email: string): Promise<{
    success: boolean;
    message: string;
    resetToken?: string;
  }> {
    try {
      const user = await User.findOne({ email });

      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      // Generate reset token
      const crypto = require('crypto');
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Save to user
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpiry = resetTokenExpiry;
      await user.save();

      // Send reset email
      const emailSent = await emailService.sendPasswordResetEmail(
        email,
        resetToken,
        user.name
      );

      if (!emailSent) {
        return {
          success: false,
          message: 'Failed to send reset email',
        };
      }

      Logger.info(`Password reset token generated for ${email}`);

      return {
        success: true,
        message: 'Password reset email sent',
        resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined,
      };
    } catch (error: any) {
      Logger.error('Generate reset token error:', error);
      return {
        success: false,
        message: 'Failed to generate reset token',
      };
    }
  }

  // Reset password with token
  static async resetPasswordWithToken(
    token: string,
    newPassword: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpiry: { $gt: new Date() },
      }).select('+password');

      if (!user) {
        return {
          success: false,
          message: 'Invalid or expired reset token',
        };
      }

      // Update password
      user.password = newPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpiry = undefined;
      await user.save();

      Logger.info(`Password reset for user: ${user.email}`);

      return {
        success: true,
        message: 'Password reset successful',
      };
    } catch (error: any) {
      Logger.error('Reset password error:', error);
      return {
        success: false,
        message: 'Failed to reset password',
      };
    }
  }

  // Validate reset token
  static async validateResetToken(token: string): Promise<{
    valid: boolean;
    message: string;
    email?: string;
  }> {
    try {
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpiry: { $gt: new Date() },
      });

      if (!user) {
        return {
          valid: false,
          message: 'Invalid or expired reset token',
        };
      }

      return {
        valid: true,
        message: 'Token is valid',
        email: user.email,
      };
    } catch (error: any) {
      Logger.error('Validate reset token error:', error);
      return {
        valid: false,
        message: 'Failed to validate token',
      };
    }
  }
}