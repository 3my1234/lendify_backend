import { Server } from 'http';
import { Server as SocketServer } from 'socket.io';
import { WebhookService } from './webhookService';

export class SocketService {
  private io: SocketServer;
  private webhookService!: WebhookService;

  constructor(server: Server) {
    this.io = new SocketServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL,
        credentials: true
      }
    });

    this.setupSocketHandlers();
  }

  private setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log('Client connected');

      socket.on('join', (userId: string) => {
        socket.join(userId);
        console.log(`User ${userId} joined their room`);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected');
      });
    });
  }

  initializeRewardUpdates() {
    setInterval(() => {
      this.io.emit('investment-update');
    }, 60000);
  }

  notifyUser(userId: string, message: any) {
    console.log(`Attempting to notify user ${userId} with message:`, message);
    
    try {
      // Convert message to string if it's an object
      const messageToSend = typeof message === 'object' ? JSON.stringify(message) : message;
      
      // Send to specific user room
      this.io.to(userId).emit('notification', message);
      
      console.log(`Notification sent to user ${userId}`);
      return true;
    } catch (error) {
      console.error(`Failed to send notification to user ${userId}:`, error);
      return false;
    }
  }
  

  getIO() {
    return this.io;
  }
}
