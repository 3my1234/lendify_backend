import { Investment } from '../models/Investment';
import { User } from '../models/User';
import { NotificationService } from './notificationService';
import { AppDataSource } from '../config/data-source';
import { LessThanOrEqual } from 'typeorm';
import { Types } from 'mongoose';

export class InvestmentMaturityService {
  private investmentRepository = AppDataSource.getRepository(Investment);
  private userRepository = AppDataSource.getRepository(User);

  constructor(private notificationService: NotificationService) {}

  async checkMaturedInvestments() {
    const now = new Date();
    const maturedInvestments = await this.investmentRepository.find({
      where: {
        status: 'active',
        endDate: LessThanOrEqual(now)
      },
      relations: ['user']
    });

    for (const investment of maturedInvestments) {
      await this.processMaturedInvestment(investment);
    }
  }

  private async processMaturedInvestment(investment: Investment) {
    const totalReturn = investment.amount + (investment.amount * investment.returnRate);
    
    investment.status = 'completed';
    await this.investmentRepository.save(investment);

    await this.userRepository.update(investment.user.id, {
      investment_balance: () => `investment_balance + ${totalReturn}`
    });

    await this.notificationService.notify({
      userId: investment.user.id, // Just use the UUID directly
      type: 'investment',
      title: 'Investment Matured',
      message: `Your investment of ${investment.amount} has matured with a return of ${totalReturn}`
    });
  }
}
