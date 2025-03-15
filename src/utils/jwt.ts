import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User';

export const generateToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const generateAuthToken = (user: User): string => {
  return jwt.sign(
    { 
      userId: user.id, 
      role: user.role 
    },
    process.env.SECRET!,
    { expiresIn: '24h' }
  );
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, process.env.SECRET!);
  } catch (error) {
    return null;
  }
};

export const generatePasswordResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};
