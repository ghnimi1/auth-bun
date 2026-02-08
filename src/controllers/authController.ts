import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { User } from '../models/user';
import { generateTokens, setRefreshTokenCookie, clearRefreshTokenCookie, sanitizeUser } from '../utils/helpers';
import { Logger } from '../utils/logger';
import type { AuthRequest } from '../middleware/auth';

export class AuthController {
  // Register new user
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, name } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res.status(400).json({ error: 'Email already exists' });
        return;
      }

      // Create new user
      const user = new User({
        email,
        password,
        name,
      });

      await user.save();

      // Generate tokens
      const tokens = generateTokens(user._id.toString());

      // Save refresh token to user
      user.refreshToken = tokens.refreshToken;
      await user.save();

      // Set refresh token as HTTP-only cookie
      setRefreshTokenCookie(res, tokens.refreshToken);

      // Update last login
      await user.updateLastLogin();

      Logger.info(`User registered: ${email}`);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: sanitizeUser(user),
        accessToken: tokens.accessToken,
      });
    } catch (error: any) {
      Logger.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Login user
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Find user by email with password
      const user = await User.findOne({ email }).select('+password');
      
      if (!user) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Check if user is active
      if (!user.isActive) {
        res.status(401).json({ error: 'Account is inactive' });
        return;
      }

      // Verify password
      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Generate tokens
      const tokens = generateTokens(user._id.toString());

      // Save refresh token to user
      user.refreshToken = tokens.refreshToken;
      await user.save();

      // Set refresh token as HTTP-only cookie
      setRefreshTokenCookie(res, tokens.refreshToken);

      // Update last login
      await user.updateLastLogin();

      Logger.info(`User logged in: ${email}`);

      res.json({
        success: true,
        message: 'Login successful',
        user: sanitizeUser(user),
        accessToken: tokens.accessToken,
      });
    } catch (error: any) {
      Logger.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Logout user
  static async logout(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = req.user;

      if (user) {
        // Clear refresh token from user
        user.refreshToken = undefined;
        await user.save();
      }

      // Clear refresh token cookie
      clearRefreshTokenCookie(res);

      Logger.info(`User logged out: ${user?.email}`);

      res.json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error: any) {
      Logger.error('Logout error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Refresh access token
  static async refreshToken(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      const oldRefreshToken = req.body.refreshToken || req.cookies.refreshToken;

      if (!oldRefreshToken) {
        res.status(400).json({ error: 'Refresh token required' });
        return;
      }

      // Verify old refresh token
      jwt.verify(oldRefreshToken, env.JWT_REFRESH_SECRET);

      // Generate new tokens
      const tokens = generateTokens(user._id.toString());

      // Save new refresh token to user
      user.refreshToken = tokens.refreshToken;
      await user.save();

      // Set new refresh token as HTTP-only cookie
      setRefreshTokenCookie(res, tokens.refreshToken);

      Logger.info(`Token refreshed for user: ${user.email}`);

      res.json({
        success: true,
        accessToken: tokens.accessToken,
      });
    } catch (error: any) {
      Logger.error('Refresh token error:', error);
      res.status(401).json({ error: 'Invalid refresh token' });
    }
  }

  // Get current user profile
  static async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = await User.findById(req.user._id);
      
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({
        success: true,
        user: sanitizeUser(user),
      });
    } catch (error: any) {
      Logger.error('Get profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Update user profile
  static async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const updates = req.body;
      const userId = req.user._id;

      // Prevent updating sensitive fields
      delete updates.password;
      delete updates.role;
      delete updates.refreshToken;

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updates },
        { new: true, runValidators: true }
      );

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      Logger.info(`Profile updated for user: ${user.email}`);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        user: sanitizeUser(user),
      });
    } catch (error: any) {
      Logger.error('Update profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Change password
  static async changePassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user._id).select('+password');

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Verify current password
      const isValidPassword = await user.comparePassword(currentPassword);
      if (!isValidPassword) {
        res.status(401).json({ error: 'Current password is incorrect' });
        return;
      }

      // Update password
      user.password = newPassword;
      await user.save();

      Logger.info(`Password changed for user: ${user.email}`);

      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error: any) {
      Logger.error('Change password error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
