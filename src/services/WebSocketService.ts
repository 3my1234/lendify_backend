import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { config } from '../config';

interface JwtPayload {
  id: string;
}

export class WebSocketService {
    public io: Server;
  private userSockets: Map<string, string[]> = new Map();

  constructor(server: HttpServer) {
    this.io = new Server(server, {
      cors: {
        origin: config.frontend_url,
        methods: ['GET', 'POST']
      }
    });

    this.setupAuthMiddleware();
    this.setupConnectionHandlers();
  }

  private setupAuthMiddleware() {
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      if (!token || !config.jwtSecret) {
        return next(new Error('Authentication error'));
      }

      try {
        const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
        socket.data.userId = decoded.id;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });
  }

  private setupConnectionHandlers() {
    this.io.on('connection', (socket) => {
      const userId = socket.data.userId;
      
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, []);
      }
      this.userSockets.get(userId)?.push(socket.id);

      socket.on('disconnect', () => {
        const userSocketIds = this.userSockets.get(userId) || [];
        this.userSockets.set(
          userId,
          userSocketIds.filter(id => id !== socket.id)
        );
      });
    });
  }

  notifyUser(userId: string, data: unknown) {
    const userSocketIds = this.userSockets.get(userId);
    if (userSocketIds) {
      userSocketIds.forEach(socketId => {
        this.io.to(socketId).emit('notification', data);
      });
    }
  }

  notifyUsers(userIds: string[], data: unknown) {
    userIds.forEach(userId => this.notifyUser(userId, data));
  }

  broadcastNotification(data: unknown) {
    this.io.emit('notification', data);
  }
}

// Create and export instance
export const webSocketService = new WebSocketService(require('http').createServer());
