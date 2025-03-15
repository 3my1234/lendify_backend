import { Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { Investment } from '../models/Investment';
import { User } from '../models/User';
import { Transaction } from '../models/Transaction';
import { generateReference } from '../utils/helpers';

const investmentRepository = AppDataSource.getRepository(Investment);
const userRepository = AppDataSource.getRepository(User);
const transactionRepository = AppDataSource.getRepository(Transaction);

interface AuthenticatedRequest extends Request {
  user: User;
  userId: string;
}

export const investmentController = {
  async createInvestment(req: AuthenticatedRequest, res: Response) {
    try {
      const { amount, duration } = req.body;
      const userId = req.user.id;
      const reference = generateReference();

      const returnRateMap: { [key: number]: 0.25 | 0.50 | 1.00 | 2.00 } = {
        30: 0.25,
        60: 0.50,
        90: 1.00,
        180: 2.00
      };

      const endDate = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);
      const returnRate = returnRateMap[duration];

      const investment = new Investment();
      investment.user = req.user;
      investment.amount = amount;
      investment.duration = duration;
      investment.returnRate = returnRate;
      investment.startDate = new Date();
      investment.endDate = endDate;
      investment.totalReturn = amount * (1 + returnRate);
      investment.reference = reference;
      investment.stakingStartDate = new Date();
      investment.stakingEndDate = endDate;
      investment.rewards = {
        baseRate: returnRate,
        compoundRate: 0,
        totalReward: 0,
        lastCalculated: new Date()
      };

      await investmentRepository.save(investment);

      const transaction = new Transaction();
      transaction.user = req.user;
      transaction.type = 'investment';
      transaction.amount = amount;
      transaction.status = 'active';
      transaction.reference = reference;
      transaction.investment_details = {
        duration,
        returnRate,
        endDate
      };

      await transactionRepository.save(transaction);

      res.status(201).json({
        success: true,
        investment,
        transaction
      });
    } catch (err) {
      const error = err as Error;
      res.status(400).json({
        success: false,
        error: error.message || 'Investment creation failed'
      });
    }
  },

  async getInvestments(req: AuthenticatedRequest, res: Response) {
    try {
      const investments = await investmentRepository.find({
        where: { user: { id: req.user.id } },
        order: { createdAt: 'DESC' }
      });

      res.json({
        success: true,
        investments
      });
    } catch (err) {
      const error = err as Error;
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch investments'
      });
    }
  },

  async checkInvestmentStatus() {
    try {
      const activeInvestments = await investmentRepository.find({
        where: { status: 'active' },
        relations: ['user']
      });

      for (const investment of activeInvestments) {
        if (new Date() >= investment.endDate) {
          investment.status = 'completed';
          await investmentRepository.save(investment);

          await userRepository.update(
            { id: investment.user.id },
            { investment_balance: () => `investment_balance + ${investment.totalReturn}` }
          );
        }
      }
    } catch (err) {
      const error = err as Error;
      console.error('Error checking investment status:', error.message);
    }
  }
};
