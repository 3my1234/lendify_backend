import { Server as SocketServer } from 'socket.io';
import { AppDataSource } from '../config/data-source';
import { User } from '../models/User';
import { Transaction } from '../models/Transaction';
import { Support } from '../models/Support';
import { NotificationService } from './notificationService';

interface NOWPaymentsWebhook {
  payment_id: string;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  actually_paid: number;
  pay_currency: string;
  order_id: string;
  order_description: string;
}

export class WebhookService {
  private userRepository = AppDataSource.getRepository(User);
  private transactionRepository = AppDataSource.getRepository(Transaction);
  private supportRepository = AppDataSource.getRepository(Support);

  constructor(
    private socketServer: SocketServer,
    private notificationService: NotificationService
  ) {
    this.initializeWebhooks();
  }

  private initializeWebhooks() {
    this.handleTransactionWebhooks();
    this.handleSupportWebhooks();
    this.handleInvestmentWebhooks();
    this.handleProfileWebhooks();
    this.handleNOWPaymentsWebhooks();
  }

  private handleTransactionWebhooks() {
    this.socketServer.on('transaction', async (data) => {
      const { type, userId, status, details } = data;
      
      await this.notificationService.notify({
        userId,
        type: 'transaction',
        title: `Transaction ${status}`,
        message: `Your ${type} transaction has ${status}. ${details || ''}`
      });

      if (data.transactionId) {
        await this.transactionRepository.update(
          data.transactionId,
          { status: status }
        );
      }
    });
  }

  private handleSupportWebhooks() {
    this.socketServer.on('support', async (data) => {
      const { ticketId, message, fromUser, toUser } = data;
      
      await this.notificationService.notify({
        userId: toUser,
        type: 'support',
        title: 'New Support Message',
        message: message
      });

      const ticket = await this.supportRepository.findOne({
        where: { id: ticketId }
      });
      
      if (ticket) {
        ticket.replies = [...ticket.replies, {
          user_id: fromUser,
          message,
          timestamp: new Date()
        }];
        await this.supportRepository.save(ticket);
      }
    });
  }

  private handleInvestmentWebhooks() {
    this.socketServer.on('investment', async (data) => {
      const { type, userId, amount, duration, status } = data;
      
      await this.notificationService.notify({
        userId,
        type: 'investment',
        title: `Investment ${status}`,
        message: `Your ${duration}-day investment of ${amount} Lendi has ${status}`
      });
    });
  }

  private handleProfileWebhooks() {
    this.socketServer.on('profile', async (data) => {
      const { userId, action, status } = data;
      
      await this.notificationService.notify({
        userId,
        type: 'profile',
        title: 'Profile Update',
        message: `Profile ${action} has ${status}`
      });
    });
  }

  private handleNOWPaymentsWebhooks() {
    this.socketServer.on('nowpayments_ipn', async (data: NOWPaymentsWebhook) => {
      const transaction = await this.transactionRepository.findOne({
        where: { reference: data.payment_id },
        relations: ['user']
      });

      if (!transaction) return;

      if (data.payment_status === 'finished') {
        transaction.status = 'completed';
        await this.transactionRepository.save(transaction);

        await this.userRepository.update(
          { id: transaction.user.id },
          { investment_balance: () => `investment_balance + ${transaction.amount}` }
        );

        await this.notificationService.notify({
          userId: transaction.user.id,
          type: 'transaction',
          title: 'Deposit Successful',
          message: `Your deposit of ${transaction.amount} LENDI has been confirmed`
        });

        this.socketServer.to(transaction.user.id).emit('transaction_update', {
          type: 'deposit',
          status: 'completed',
          amount: transaction.amount
        });
      }
    });
  }

  public async emitWebhook(event: string, data: any) {
    this.socketServer.emit(event, data);
  }
}
