import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { User } from '../models/user';
import { generateTokens } from '../utils/helpers';
import { Logger } from '../utils/logger';

export class AuthService {
  static async validateCredentials(email: string, password: string): Promise<any> {
    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !user.isActive) {
      return null;
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return null;
    }

    return user;
  }

  static async createUser(userData: any): Promise<any> {
    const user = new User(userData);
    await user.save();
    return user;
  }

  static async updateUserTokens(userId: string): Promise<{ accessToken: string; refreshToken: string }> {
    const tokens = generateTokens(userId);
    
    await User.findByIdAndUpdate(userId, {
      refreshToken: tokens.refreshToken,
      lastLogin: new Date(),
    });

    return tokens;
  }

  static async invalidateRefreshToken(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $unset: { refreshToken: 1 },
    });
  }

  static async verifyAccessToken(token: string): Promise<any> {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
      const user = await User.findById(decoded.userId).select('-password -refreshToken');
      
      if (!user || !user.isActive) {
        return null;
      }

      return user;
    } catch (error) {
      Logger.error('Token verification error:', error);
      return null;
    }
  }
}