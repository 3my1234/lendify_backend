import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { BlacklistedToken } from '../models/BlacklistedToken';
import { AppDataSource } from '../config/data-source';
import { AppError } from '../middleware/errorHandler';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email';
import { generateToken, generateAuthToken } from '../utils/jwt';
import { MoreThan } from 'typeorm';

const userRepository = AppDataSource.getRepository(User);
const blacklistedTokenRepository = AppDataSource.getRepository(BlacklistedToken);

interface TokenPayload {
  userId: string;
  role: string;
  exp?: number;
}

interface AuthenticatedRequest extends Request {
  user: User;
  userId: string;
}

export const authController = {
  async register(req: Request, res: Response) {
    try {
      const { username, email, password } = req.body;
      
      // First check email
      const existingEmail = await userRepository.findOne({ 
        where: { email } 
      });
      
      if (existingEmail) {
        return res.status(400).json({ 
          success: false,
          error: 'Email already registered'
        });
      }

      // Then check username
      const existingUsername = await userRepository.findOne({ 
        where: { username } 
      });
      
      if (existingUsername) {
        return res.status(400).json({ 
          success: false,
          error: 'Username already taken'
        });
      }
  
      const hashedPassword = await bcrypt.hash(password, 12);
      const verificationToken = generateToken();
      
      const user = userRepository.create({
        username,
        email,
        password: hashedPassword,
        verificationToken,
        verificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        is_active: false,
        role: 'user'
      });
      
      await userRepository.save(user);
      await sendVerificationEmail(email, verificationToken);
      
      res.status(201).json({
        success: true,
        message: 'Registration successful. Please check your email for verification.'
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Registration failed'
      });
    }
},

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const user = await userRepository.findOne({ where: { email } });
      
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
  
      if (!user.is_active) {
        return res.status(403).json({ error: 'Please verify your email before logging in' });
      }
  
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
  
      const token = generateAuthToken(user);

      // Ensure we're sending the correct user data structure
      const userData = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        is_active: user.is_active
      };
    
      return res.json({
        token,
        user: userData
      });
    } catch (error) {
      res.status(500).json({ error: 'Login failed' });
    }
},

async logout(req: AuthenticatedRequest, res: Response) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token!, process.env.SECRET!) as TokenPayload;
    
    const blacklistedToken = blacklistedTokenRepository.create({
      token: token!,
      userId: req.userId,
      expiresAt: new Date(decoded.exp! * 1000)
    });
    
    await blacklistedTokenRepository.save(blacklistedToken);
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    throw new AppError('Logout failed', 500);
  }
},



  async verifyEmail(req: Request, res: Response) {
    try {
      const { token } = req.params;
      const user = await userRepository.findOne({ 
        where: { 
          verificationToken: token,
          is_active: false 
        } 
      });
      
      if (!user) {
        return res.status(400).json({ 
          success: false,
          message: 'Invalid or expired verification token' 
        });
      }
  
      user.is_active = true;
      user.verificationToken = undefined;  // Changed from null to undefined
      await userRepository.save(user);
      
      return res.status(200).json({ 
        success: true,
        message: 'Email verified successfully. You can now login.'
      });
    } catch (error) {
      throw new AppError('Email verification failed', 500);
    }
},

  
async forgotPassword(req: Request, res: Response) {
  try {
    const { email } = req.body;
    const user = await userRepository.findOne({ where: { email } });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'If a user with this email exists, a password reset link will be sent.'
      });
    }

    const resetToken = generateToken();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await userRepository.save(user);
    
    await sendPasswordResetEmail(email, resetToken);
    
    res.json({
      success: true,
      message: 'Password reset instructions have been sent to your email'
    });
  } catch (error) {
    throw new AppError('Failed to process password reset request', 500);
  }
},

async resetPassword(req: Request, res: Response) {
  try {
    const { token, newPassword } = req.body;
    const user = await userRepository.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: MoreThan(new Date())
      }
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Password reset token is invalid or has expired'
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await userRepository.save(user);
    
    res.json({
      success: true,
      message: 'Password has been reset successfully. Please login with your new password.'
    });
  } catch (error) {
    throw new AppError('Failed to reset password', 500);
  }
},

  async resendVerification(req: Request, res: Response) {
    try {
      const { email } = req.body;
      const user = await userRepository.findOne({ where: { email } });
      
      if (!user) {
        throw new AppError('User not found', 404);
      }
      
      if (user.is_active) {
        return res.status(400).json({
          success: false,
          message: 'Email is already verified'
        });
      }

      const verificationToken = generateToken();
      user.verificationToken = verificationToken;
      await userRepository.save(user);
      
      await sendVerificationEmail(email, verificationToken);
      
      res.json({
        success: true,
        message: 'Verification email has been resent'
      });
    } catch (error) {
      throw new AppError('Failed to resend verification email', 500);
    }
},

  async getCurrentUser(req: AuthenticatedRequest, res: Response) {
    try {
      const user = await userRepository.findOne({ 
        where: { id: req.userId },
        select: ['id', 'username', 'email', 'role', 'is_active', 'investment_balance']
      });
      
      if (!user) {
        throw new AppError('User not found', 404);
      }
      res.json({ user });
    } catch (error) {
      throw new AppError('Failed to fetch user', 500);
    }
  },

  async getProfile(req: Request, res: Response) {
    try {
      const user = await userRepository.findOne({
        where: { id: req.userId },
        select: ['fullName', 'phoneNumber', 'address', 'bank_details', 'profile_completed']
      });
      
      if (!user) {
        throw new AppError('User not found', 404);
      }
  
      res.json(user);
    } catch (error) {
      throw new AppError('Failed to fetch profile', 500);
    }
  },

   async updateProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const updateData = {
        ...req.body,
        profile_completed: true
      };

      const user = await userRepository.save({
        id: req.userId,
        ...updateData
      });
      
      if (!user) {
        throw new AppError('User not found', 404);
      }
      
      const { password, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      throw new AppError('Failed to update profile', 500);
    }
  }
};
