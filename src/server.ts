import { createServer } from 'http';
import app from './app';
import { env } from './config/env.config';
import { SocketService } from './services/SocketService';
import { NotificationService } from './services/notificationService';
import { WebhookService } from './services/webhookService';
import { cleanupExpiredTokens } from './services/tokenCleanupService';

const startServer = () => {
  try {
    const httpServer = createServer(app);
    
    // Initialize services in the correct order
    const socketService = new SocketService(httpServer);
    const notificationService = new NotificationService(socketService);
    const webhookService = new WebhookService(socketService.getIO(), notificationService);

    // Set up socket service
    socketService.initializeRewardUpdates();
    
    // Make services available in app
    app.set('socketService', socketService);
    app.set('notificationService', notificationService);
    app.set('webhookService', webhookService);

    // Start the server
    httpServer.listen(env.PORT, () => {
      console.log(`
        🚀 Server is running!
        🔊 Listening on port ${env.PORT}
        📱 Environment: ${env.NODE_ENV}
        🔌 WebSocket enabled
        📨 Notifications system initialized
      `);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
