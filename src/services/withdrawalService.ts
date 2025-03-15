import { Types } from 'mongoose';
import { Transaction } from '../models/Transaction';
import { User } from '../models/User';
import { AppDataSource } from '../config/data-source';
import { generateReference } from '../utils/helpers';

const transactionRepository = AppDataSource.getRepository(Transaction);
const userRepository = AppDataSource.getRepository(User);

export const withdrawalService = {
  async createWithdrawalRequest(
    userId: string,
    amount: number,
    cryptoType: 'BTC' | 'ETH' | 'SOL' | 'XMR',
    walletAddress: string
  ) {
    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user || user.investment_balance < amount) {
      throw new Error('Insufficient balance');
    }

    const withdrawal = transactionRepository.create({
      user: { id: userId },
      type: 'withdrawal',
      amount,
      status: 'pending',
      reference: generateReference(),
      crypto_details: {
        type: cryptoType,
        wallet_address: walletAddress
      }
    });

    await transactionRepository.save(withdrawal);

    await userRepository.update({ id: userId }, {
      investment_balance: () => `investment_balance - ${amount}`
    });

    return withdrawal;
  },

  async processWithdrawal(transactionId: string, status: 'completed' | 'failed') {
    const withdrawal = await transactionRepository.findOne({ 
      where: { id: transactionId },
      relations: ['user']
    });

    if (!withdrawal) {
      throw new Error('Withdrawal not found');
    }

    if (status === 'failed') {
      await userRepository.update({ id: withdrawal.user.id }, {
        investment_balance: () => `investment_balance + ${withdrawal.amount}`
      });
    }

    await transactionRepository.update({ id: transactionId }, { status });
    return withdrawal;
  }
};
