import { Types } from 'mongoose';
import { Investment } from '../models/Investment';
import { User } from '../models/User';
import { AppDataSource } from '../config/data-source';
import { generateReference } from '../utils/helpers';

const investmentRepository = AppDataSource.getRepository(Investment);
const userRepository = AppDataSource.getRepository(User);

export const investmentService = {
  calculateReturns(amount: number, duration: 30 | 60 | 90 | 180): number {
    const rates: { [key: number]: 0.25 | 0.50 | 1.00 | 2.00 } = {
      30: 0.25,
      60: 0.50,
      90: 1.00,
      180: 2.00
    };
    return amount + (amount * rates[duration]);
  },

  async createInvestment(userId: string, amount: number, duration: 30 | 60 | 90 | 180) {
    const reference = generateReference();
    const returnRate: { [key: number]: 0.25 | 0.50 | 1.00 | 2.00 } = {
      30: 0.25,
      60: 0.50,
      90: 1.00,
      180: 2.00
    };

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + duration);

    const userEntity = await userRepository.findOneBy({ id: userId });
    if (!userEntity) throw new Error('User not found');

    const investment = new Investment();
    investment.user = userEntity;
    investment.amount = amount;
    investment.duration = duration;
    investment.returnRate = returnRate[duration];
    investment.endDate = endDate;
    investment.totalReturn = amount + (amount * returnRate[duration]);
    investment.reference = reference;
    investment.startDate = new Date();
    investment.stakingStartDate = new Date();
    investment.stakingEndDate = endDate;
    investment.rewards = {
      baseRate: returnRate[duration],
      compoundRate: 0,
      totalReward: 0,
      lastCalculated: new Date()
    };

    await investmentRepository.save(investment);

    await userRepository.update({ id: userId }, {
      investment_balance: () => `investment_balance - ${amount}`
    });

    return investment;
  }
};
