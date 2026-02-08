import type { Request, Response } from 'express';
import { User } from '../models/user';
import { sanitizeUser } from '../utils/helpers';
import { Logger } from '../utils/logger';
import type { AuthRequest } from '../middleware/auth';

export class UserController {
  // Get all users (admin only)
  static async getAllUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const users = await User.find({}).select('-password -refreshToken');
      
      res.json({
        success: true,
        count: users.length,
        users,
      });
    } catch (error: any) {
      Logger.error('Get all users error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get user by ID
  static async getUserById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.params.id;
      const user = await User.findById(userId).select('-password -refreshToken');

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({
        success: true,
        user,
      });
    } catch (error: any) {
      Logger.error('Get user by ID error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Update user (admin only)
  static async updateUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.params.id;
      const updates = req.body;

      // Prevent updating sensitive fields
      delete updates.password;
      delete updates.refreshToken;

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updates },
        { new: true, runValidators: true }
      ).select('-password -refreshToken');

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      Logger.info(`User updated by admin: ${user.email}`);

      res.json({
        success: true,
        message: 'User updated successfully',
        user,
      });
    } catch (error: any) {
      Logger.error('Update user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Delete user (admin only)
  static async deleteUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.params.id;
      const user = await User.findById(userId);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Prevent self-deletion
      if (user._id.toString() === req.user._id.toString()) {
        res.status(400).json({ error: 'Cannot delete your own account' });
        return;
      }

      await user.deleteOne();

      Logger.info(`User deleted by admin: ${user.email}`);

      res.json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error: any) {
      Logger.error('Delete user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Toggle user active status (admin only)
  static async toggleUserStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.params.id;
      const user = await User.findById(userId);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Prevent self-deactivation
      if (user._id.toString() === req.user._id.toString()) {
        res.status(400).json({ error: 'Cannot deactivate your own account' });
        return;
      }

      user.isActive = !user.isActive;
      await user.save();

      Logger.info(`User status toggled: ${user.email} - Active: ${user.isActive}`);

      res.json({
        success: true,
        message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
        user: sanitizeUser(user),
      });
    } catch (error: any) {
      Logger.error('Toggle user status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}