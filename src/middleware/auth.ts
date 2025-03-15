import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { AppDataSource } from '../config/data-source';
import { BlacklistedToken } from '../models/BlacklistedToken';

const userRepository = AppDataSource.getRepository(User);
const blacklistedTokenRepository = AppDataSource.getRepository(BlacklistedToken);

interface TokenPayload {
  userId: string;
  role: string;
}

interface AuthRequest extends Request {
  user: User;
  userId: string;
}

export const auth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const decoded = jwt.verify(token, process.env.SECRET!) as TokenPayload;
    const user = await userRepository.findOne({ 
      where: { id: decoded.userId },
      select: ['id', 'username', 'email', 'role', 'is_active']
    });

    if (!user || !user.is_active) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    req.user = user;
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};



export const adminAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const decoded = jwt.verify(token, process.env.SECRET!) as TokenPayload;
    const user = await userRepository.findOne({ where: { id: decoded.userId } });

    if (!user || !user.is_active || !['admin', 'super_admin'].includes(user.role)) {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    req.user = user;
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};
