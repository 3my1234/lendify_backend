import { Request, Response } from 'express';
import { IAdminInvite } from '../models/AdminInvite';
import { User } from '../models/User';
import { Investment } from '../models/Investment';
import { Transaction } from '../models/Transaction';
import { Support } from '../models/Support';
import { AdminInvite } from '../models/AdminInvite';
import { AppDataSource } from '../config/data-source';
import { generateToken } from '../utils/jwt';
import { sendAdminInviteEmail } from '../utils/email';
import { MoreThan, In, Repository } from 'typeorm';
import bcrypt from 'bcryptjs';
import { generateReference } from '../utils/helpers';

const userRepository = AppDataSource.getRepository(User);
const adminInviteRepository = AppDataSource.getRepository(AdminInvite);
const investmentRepository = AppDataSource.getRepository(Investment);
const transactionRepository = AppDataSource.getRepository(Transaction);

interface AuthenticatedRequest extends Request {
  user: User;
  userId: string;
}

export const adminController = {
  async createSuperAdmin(req: Request, res: Response) {
    try {
      const { username, email, password, adminSecretKey } = req.body;

      if (adminSecretKey !== process.env.ADMIN_SECRET_KEY) {
        return res.status(403).json({ error: 'Invalid admin secret key' });
      }

      const existingUser = await userRepository.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const user = userRepository.create({
        username,
        email,
        password: hashedPassword,
        role: 'super_admin',
        is_active: true
      });

      await userRepository.save(user);
      return res.status(201).json({ message: 'Super admin created successfully' });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create super admin' });
    }
  },

  async sendAdminInvite(req: AuthenticatedRequest, res: Response) {
    if (req.user.role !== 'super_admin') {
        return res.status(403).json({ error: 'Only super admin can send invites' });
    }

    const { email } = req.body;
    const token = generateToken(); // This generates a random token
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const invite = adminInviteRepository.create({
        email,
        token,
        role: 'admin',
        expires,
        used: false
    });

    await adminInviteRepository.save(invite);
    await sendAdminInviteEmail(email, token);

    return res.status(201).json({ message: 'Admin invitation sent successfully' });
},
  

async verifyInviteToken(req: Request, res: Response) {
  const { token } = req.query;
  
  const invite = await adminInviteRepository.findOne({
      where: {
          token: token as string,
          used: false,
          expires: MoreThan(new Date())
      }
  });

  if (!invite) {
      return res.status(400).json({ error: 'Invalid or expired invitation' });
  }

  return res.json({ 
      success: true,
      data: {
          email: invite.email,
          role: invite.role
      }
  });
},
  
  async getUserList(req: AuthenticatedRequest, res: Response) {
    try {
      const users = await userRepository.find({
        select: ['id', 'username', 'email', 'role', 'is_active', 'createdAt'],
        order: { createdAt: 'DESC' }
      });
      
      return res.json({ 
        success: true,
        users 
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch users' });
    }
  },


  async getAdminSettings(req: AuthenticatedRequest, res: Response) {
    try {
      const settings = {
        systemSettings: {
          maintenance: false,
          registrationEnabled: true
        },
        emailSettings: {
          notificationsEnabled: true
        }
      };
      
      return res.json({
        success: true,
        settings
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch admin settings' });
    }
  },

  async completeAdminRegistration(req: Request, res: Response) {
    const { token, username, password } = req.body;
    
    const invite = await adminInviteRepository.findOne({
        where: {
            token,
            used: false,
            expires: MoreThan(new Date())
        }
    });

    if (!invite) {
        return res.status(400).json({ error: 'Invalid or expired invitation' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    
    const newAdmin = userRepository.create({
        username,
        email: invite.email,
        password: hashedPassword,
        role: 'admin',
        is_active: true
    });

    await userRepository.save(newAdmin);
    
    invite.used = true;
    await adminInviteRepository.save(invite);

    return res.json({ success: true, message: 'Admin registration completed' });
},
  
  async resetSuperAdminPassword(req: Request, res: Response) {
    try {
      const { adminSecretKey, newPassword } = req.body;
  
      if (adminSecretKey !== process.env.ADMIN_SECRET_KEY) {
        return res.status(403).json({ error: 'Invalid admin secret key' });
      }
  
      const superAdmin = await userRepository.findOne({ 
        where: { role: 'super_admin' }
      });

      if (!superAdmin) {
        return res.status(404).json({ error: 'Super admin not found' });
      }
  
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      superAdmin.password = hashedPassword;
      await userRepository.save(superAdmin);
  
      return res.status(200).json({ message: 'Super admin password reset successfully' });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to reset super admin password' });
    }
  },

  


  async getAdminList(req: AuthenticatedRequest, res: Response) {
    try {
      const admins = await userRepository.find({
        where: { role: In(['admin', 'super_admin']) },
        select: ['id', 'username', 'email', 'role', 'createdAt']
      });
      
      return res.json({ admins });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch admin list' });
    }
  },

  async removeAdmin(req: AuthenticatedRequest, res: Response) {
    try {
      const { adminId } = req.params;
      const adminToRemove = await userRepository.findOne({
        where: { id: adminId }
      });
      
      if (!adminToRemove) {
        return res.status(404).json({ error: 'Admin not found' });
      }

      if (adminToRemove.role === 'super_admin' && req.user.role !== 'super_admin') {
        return res.status(403).json({ error: 'Only super admins can remove other super admins' });
      }

      await userRepository.remove(adminToRemove);
      return res.json({ message: 'Admin removed successfully' });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to remove admin' });
    }
  },

 
  async getDashboardStats(req: Request, res: Response) {
    try {
      const totalUsers = await userRepository.count();
      const activeInvestments = await investmentRepository.count({ 
        where: { status: 'active' } 
      });

      const totalInvested = await investmentRepository
        .createQueryBuilder('investment')
        .select('SUM(investment.amount)', 'total')
        .getRawOne();

      const pendingWithdrawals = await transactionRepository.find({
        where: {
          type: 'withdrawal',
          status: 'pending'
        },
        relations: ['user'],
        select: {
          user: {
            username: true,
            email: true
          }
        }
      });

      const referralStats = await userRepository
        .createQueryBuilder('user')
        .select('SUM(user.referral_earnings)', 'total')
        .where('user.referral_earnings > 0')
        .getRawOne();

      const investmentsByDuration = await investmentRepository
        .createQueryBuilder('investment')
        .select('investment.duration', 'duration')
        .addSelect('COUNT(*)', 'count')
        .addSelect('SUM(investment.amount)', 'totalAmount')
        .groupBy('investment.duration')
        .getRawMany();

      res.json({
        success: true,
        stats: {
          totalUsers,
          activeInvestments,
          totalInvestedAmount: totalInvested?.total || 0,
          pendingWithdrawalsCount: pendingWithdrawals.length,
          totalReferralEarnings: referralStats?.total || 0,
          investmentsByDuration
        },
        pendingWithdrawals
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
  },

  async getInvestmentReports(req: Request, res: Response) {
    try {
      const investments = await investmentRepository
        .createQueryBuilder('investment')
        .select('investment.duration', 'duration')
        .addSelect('SUM(investment.amount)', 'totalAmount')
        .addSelect('COUNT(*)', 'count')
        .groupBy('investment.duration')
        .getRawMany();

      res.json({ investments });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch investment reports' });
    }
  },

  async getReferralStats(req: Request, res: Response) {
    try {
      const topReferrers = await userRepository.find({
        where: {
          referral_earnings: MoreThan(0)
        },
        select: ['username', 'referral_earnings'],
        order: {
          referral_earnings: 'DESC'
        },
        take: 10
      });

      res.json({ topReferrers });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch referral stats' });
    }
  }
};
