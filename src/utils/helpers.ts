import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { User } from '../models/user';

export const generateTokens = (userId: string) => {
  const accessToken = jwt.sign({ userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as any,
  });

  const refreshToken = jwt.sign({ userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
  });

  return { accessToken, refreshToken };
};

export const setRefreshTokenCookie = (res: any, refreshToken: string): void => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
};

export const clearRefreshTokenCookie = (res: any): void => {
  res.clearCookie('refreshToken');
};

export const sanitizeUser = (user: any) => {
  const { password, refreshToken, ...sanitizedUser } = user.toObject
    ? user.toObject()
    : user;
  return sanitizedUser;
};