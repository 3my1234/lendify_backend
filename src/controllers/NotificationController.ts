import { Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { Notification } from '../models/Notification';
import { User } from '../models/User';
import { AppError } from '../middleware/errorHandler';
import { WebSocketService } from '../services/WebSocketService';
import { WebhookService } from '../services/webhookService';

interface AuthenticatedRequest extends Omit<Request, 'user'> {
    user: User;
    userId: string;
}

export class NotificationController {
    private notificationRepository = AppDataSource.getRepository(Notification);
    private webSocketService: WebSocketService;
    private webhookService: WebhookService;

    constructor(webSocketService: WebSocketService, webhookService: WebhookService) {
        this.webSocketService = webSocketService;
        this.webhookService = webhookService;
    }

    private async sendRealTimeNotification(userId: string, notification: Notification) {
        const notificationData = {
            id: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            timestamp: notification.createdAt,
            metadata: notification.metadata
        };

        await this.webhookService.emitWebhook('notification', {
            userId,
            ...notificationData
        });

        this.webSocketService.notifyUser(userId, notificationData);
    }

    async getNotifications(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.userId;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const skip = (page - 1) * limit;

            const [notifications, total] = await this.notificationRepository.findAndCount({
                where: { user: { id: userId } },
                order: { createdAt: 'DESC' },
                skip,
                take: limit,
                relations: ['investment', 'transaction', 'support', 'adminInvite']
            });

            return res.json({
                success: true,
                notifications,
                pagination: {
                    total,
                    page,
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            throw new AppError('Failed to fetch notifications', 500);
        }
    }

    async getUnreadCount(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.userId;
            const count = await this.notificationRepository.count({
                where: { user: { id: userId }, read: false }
            });

            return res.json({ success: true, count });
        } catch (error) {
            throw new AppError('Failed to get unread count', 500);
        }
    }

    async markAsRead(req: AuthenticatedRequest, res: Response) {
        try {
            const { id } = req.params;
            const userId = req.userId;

            const notification = await this.notificationRepository.update(
                { id, user: { id: userId } },
                { read: true }
            );

            await this.webhookService.emitWebhook('notification_update', {
                userId,
                notificationId: id,
                type: 'READ_STATUS',
                read: true
            });

            this.webSocketService.notifyUser(userId, {
                type: 'UPDATE_NOTIFICATION',
                notificationId: id,
                read: true
            });

            return res.json({ success: true, message: 'Notification marked as read' });
        } catch (error) {
            throw new AppError('Failed to mark notification as read', 500);
        }
    }

    async markAllAsRead(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.userId;

            await this.notificationRepository.update(
                { user: { id: userId }, read: false },
                { read: true }
            );

            await this.webhookService.emitWebhook('notification_update', {
                userId,
                type: 'MARK_ALL_READ'
            });

            this.webSocketService.notifyUser(userId, {
                type: 'MARK_ALL_READ'
            });

            return res.json({ success: true, message: 'All notifications marked as read' });
        } catch (error) {
            throw new AppError('Failed to mark all notifications as read', 500);
        }
    }

    async deleteNotification(req: AuthenticatedRequest, res: Response) {
        try {
            const { id } = req.params;
            const userId = req.userId;

            await this.notificationRepository.delete({
                id,
                user: { id: userId }
            });

            await this.webhookService.emitWebhook('notification_update', {
                userId,
                notificationId: id,
                type: 'DELETE'
            });

            this.webSocketService.notifyUser(userId, {
                type: 'DELETE_NOTIFICATION',
                notificationId: id
            });

            return res.json({ success: true, message: 'Notification deleted' });
        } catch (error) {
            throw new AppError('Failed to delete notification', 500);
        }
    }
}





