import { SocketService } from './SocketService';
import { webSocketService } from './WebSocketService';
import { User } from '../models/User';
import { AppDataSource } from '../config/data-source';
import { Notification } from '../models/Notification';
import { Server } from 'http';

interface NotificationData {
  userId: string;
  type: 'investment' | 'withdrawal' | 'referral' | 'system' | 'transaction' | 'support' | 'profile';
  title: string;
  message: string;
  referenceId?: string;
  metadata?: Record<string, any>;
}

interface SocketNotification {
  type: NotificationData['type'];
  title: string;
  message: string;
  timestamp: Date;
  referenceId?: string;
  metadata?: Record<string, any>;
}

const server = new Server();
const socketService = new SocketService(server);

export class NotificationService {
  private userRepository = AppDataSource.getRepository(User);
  private notificationRepository = AppDataSource.getRepository(Notification);
  private socketService: SocketService;

  constructor(socketService: SocketService) {
    this.socketService = socketService;
  }

  async notify(data: NotificationData): Promise<void> {
    const { userId, type, title, message, referenceId, metadata } = data;

    const socketNotification: SocketNotification = {
      type,
      title,
      message,
      timestamp: new Date(),
      referenceId,
      metadata
    };

    // Send real-time notification via WebSocket
    if (this.socketService) {
      this.socketService.notifyUser(userId.toString(), JSON.stringify(socketNotification));
    }

    // Store notification in database
    const notification = this.notificationRepository.create({
      user: { id: userId },
      type,
      title,
      message,
      referenceId,
      metadata,
      read: false,
      createdAt: new Date()
    });

    await this.notificationRepository.save(notification);
  }

  async notifyInvestmentCreated(userId: string, amount: number, investmentId: string) {
    await this.notify({
      userId,
      type: 'investment',
      title: 'Investment Created',
      message: `Your investment of ${amount} LENDI has been created successfully`,
      referenceId: investmentId,
      metadata: { amount, investmentId }
    });
  }

  async notifyWithdrawalStatus(userId: string, amount: number, status: string, withdrawalId: string) {
    await this.notify({
      userId,
      type: 'withdrawal',
      title: 'Withdrawal Update',
      message: `Your withdrawal request for ${amount} LENDI has been ${status}`,
      referenceId: withdrawalId,
      metadata: { amount, status, withdrawalId }
    });
  }

  async notifyReferralBonus(userId: string, amount: number, referrerId: string) {
    await this.notify({
      userId,
      type: 'referral',
      title: 'Referral Bonus',
      message: `You earned ${amount} LENDI from your referral!`,
      referenceId: referrerId,
      metadata: { amount, referrerId }
    });
  }

  async notifyInvestmentCompleted(userId: string, amount: number, profit: number, investmentId: string) {
    await this.notify({
      userId,
      type: 'investment',
      title: 'Investment Matured',
      message: `Your investment of ${amount} LENDI has matured with profit ${profit} LENDI`,
      referenceId: investmentId,
      metadata: { amount, profit, investmentId }
    });
  }

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    await this.notificationRepository.update(
      { id: notificationId, user: { id: userId } },
      { read: true }
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { user: { id: userId }, read: false }
    });
  }
}

export const notificationService = new NotificationService(socketService);