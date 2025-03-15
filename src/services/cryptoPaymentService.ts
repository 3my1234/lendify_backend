import { btcPayApi, btcPayConfig } from '../config/btcpay.config';
import { NotificationService } from './notificationService';
import { User } from '../models/User';
import { Transaction } from '../models/Transaction';
import { AppDataSource } from '../config/data-source';

interface BTCPayInvoice {
  id: string;
  checkoutLink: string;
  btcPrice: number;
  bitcoinAddress: string;
  status: string;
}

export class CryptoPaymentService {
  private userRepository = AppDataSource.getRepository(User);
  private transactionRepository = AppDataSource.getRepository(Transaction);

  constructor(private notificationService: NotificationService) {}

  async createPaymentInvoice(userId: string, amountUSD: number) {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) throw new Error('User not found');

    const response = await btcPayApi.post<BTCPayInvoice>(`/api/v1/stores/${btcPayConfig.storeId}/invoices`, {
      amount: amountUSD,
      currency: 'USD',
      metadata: {
        userId,
        lendiFunds: amountUSD * btcPayConfig.conversion.USD_TO_LENDI
      }
    });

    const invoice: BTCPayInvoice = response.data;

    const transaction = this.transactionRepository.create({
      user: { id: userId },
      type: 'deposit',
      amount: amountUSD * btcPayConfig.conversion.USD_TO_LENDI,
      status: 'pending',
      reference: invoice.id,
      crypto_details: {
        type: 'BTC',
        amount: invoice.btcPrice,
        wallet_address: invoice.bitcoinAddress
      }
    });

    await this.transactionRepository.save(transaction);

    return {
      invoiceId: invoice.id,
      paymentUrl: invoice.checkoutLink,
      btcAmount: invoice.btcPrice,
      walletAddress: invoice.bitcoinAddress
    };
  }

  async handlePaymentWebhook(payload: any) {
    const { invoiceId, status } = payload;
    
    const transaction = await this.transactionRepository.findOne({
      where: { reference: invoiceId },
      relations: ['user']
    });

    if (!transaction) throw new Error('Transaction not found');

    if (status === 'confirmed') {
      await this.userRepository.update(
        { id: transaction.user.id },
        { investment_balance: () => `investment_balance + ${transaction.amount}` }
      );

      transaction.status = 'completed';
      await this.transactionRepository.save(transaction);

      await this.notificationService.notify({
        userId: transaction.user.id, // Since we're using PostgreSQL, userId is a string
        type: 'transaction',
        title: 'Deposit Successful',
        message: `Your account has been credited with ${transaction.amount} Lendi`
      });
    }
  }
}
