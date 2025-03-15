import { User } from '../models/User';
import { Transaction } from '../models/Transaction';
import { AppDataSource } from '../config/data-source';
import { generateReference } from '../utils/helpers';

const userRepository = AppDataSource.getRepository(User);
const transactionRepository = AppDataSource.getRepository(Transaction);

export const referralService = {
  async createReferralCode(userId: string): Promise<string> {
    const referralCode = `LEN${Date.now().toString().slice(-8)}`;
    await userRepository.update({ id: userId }, { referral_code: referralCode });
    return referralCode;
  },

  async processReferralBonus(referrerId: string, investmentAmount: number) {
    const REFERRAL_BONUS_RATE = 0.05;
    const bonusAmount = investmentAmount * REFERRAL_BONUS_RATE;
    
    await userRepository.update({ id: referrerId }, {
      investment_balance: () => `investment_balance + ${bonusAmount}`
    });

    const userEntity = await userRepository.findOneBy({ id: referrerId });
    if (!userEntity) throw new Error('User not found');

    const transaction = new Transaction();
    transaction.user = userEntity;
    transaction.type = 'bonus';
    transaction.amount = bonusAmount;
    transaction.status = 'completed';
    transaction.reference = generateReference();

    await transactionRepository.save(transaction);
    return bonusAmount;
  }
};
