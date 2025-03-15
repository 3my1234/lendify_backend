import express, { Request, Response, NextFunction } from 'express';
import { NotificationController } from '../controllers/NotificationController';
import { auth } from '../middleware/auth';
import { webSocketService } from '../services/WebSocketService';
import { WebhookService } from '../services/webhookService';
import { notificationService } from '../services/notificationService';

const router = express.Router();

// Initialize services
const webhookService = new WebhookService(webSocketService.io, notificationService);
const notificationController = new NotificationController(webSocketService, webhookService);

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Protected routes
router.use(auth);

// Get all notifications
router.get(
  '/', 
  asyncHandler((req: Request, res: Response) => notificationController.getNotifications(req, res))
);

// Get unread notification count - Fix the path here
router.get(
  '/unread', 
  asyncHandler((req: Request, res: Response) => notificationController.getUnreadCount(req, res))
);

// Mark notification as read
router.put(
  '/:id/read', 
  asyncHandler((req: Request, res: Response) => notificationController.markAsRead(req, res))
);

// Mark all notifications as read
router.put(
  '/mark-all-read', 
  asyncHandler((req: Request, res: Response) => notificationController.markAllAsRead(req, res))
);

// Delete notification
router.delete(
  '/:id', 
  asyncHandler((req: Request, res: Response) => notificationController.deleteNotification(req, res))
);

export default router;
