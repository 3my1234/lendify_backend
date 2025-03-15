import { Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { Support } from '../models/Support';
import { User } from '../models/User';
import { NotificationService } from '../services/notificationService';

const supportRepository = AppDataSource.getRepository(Support);
const userRepository = AppDataSource.getRepository(User);

interface AuthenticatedRequest extends Request {
  user: User;
  userId: string;
}

export const supportController = {
  async createTicket(req: AuthenticatedRequest, res: Response) {
    const notificationService = new NotificationService(req.app.get('socketService'));
    try {
      const { subject, message, attachments = [] } = req.body;
      const userId = req.user.id;

      const ticket = supportRepository.create({
        user: { id: userId },
        subject,
        message,
        attachments,
        status: 'open'
      });

      await supportRepository.save(ticket);

      await notificationService.notify({
        userId,
        type: 'support',
        title: 'Support Ticket Created',
        message: `Your support ticket "${subject}" has been created`
      });

      res.status(201).json({
        success: true,
        ticket
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create support ticket' });
    }
  },

  async getTickets(req: AuthenticatedRequest, res: Response) {
    try {
      const tickets = await supportRepository.find({
        where: { user: { id: req.user.id } },
        order: { createdAt: 'DESC' }
      });

      res.json({
        success: true,
        tickets
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch tickets' });
    }
  },

  async getTicketById(req: AuthenticatedRequest, res: Response) {
    try {
      const { ticketId } = req.params;
      const ticket = await supportRepository.findOne({
        where: { id: ticketId, user: { id: req.user.id } },
        relations: ['user']
      });

      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
      }

      res.json({
        success: true,
        ticket
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch ticket' });
    }
  },

  async updateTicket(req: AuthenticatedRequest, res: Response) {
    const notificationService = new NotificationService(req.app.get('socketService'));
    try {
      const { ticketId } = req.params;
      const { message } = req.body;
  
      const ticket = await supportRepository.findOne({
        where: { id: ticketId, user: { id: req.user.id } }
      });
  
      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
      }
  
      const reply = {
        user_id: req.user.id,
        message,
        timestamp: new Date()
      };
  
      ticket.replies = [...(ticket.replies || []), reply];
      await supportRepository.save(ticket);

      await notificationService.notify({
        userId: req.user.id,
        type: 'support',
        title: 'Ticket Updated',
        message: `Your reply to ticket #${ticketId} has been recorded`
      });
  
      res.json({
        success: true,
        ticket
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update ticket' });
    }
  },

  async getAllTickets(req: AuthenticatedRequest, res: Response) {
    try {
      const tickets = await supportRepository.find({
        relations: ['user'],
        order: { createdAt: 'DESC' }
      });

      res.json({
        success: true,
        tickets
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch tickets' });
    }
  },

  async assignTicket(req: AuthenticatedRequest, res: Response) {
    const notificationService = new NotificationService(req.app.get('socketService'));
    try {
      const { ticketId } = req.params;
      const { adminId } = req.body;

      const ticket = await supportRepository.findOne({
        where: { id: ticketId },
        relations: ['user']
      });

      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
      }

      ticket.assigned_to = adminId;
      ticket.status = 'in_progress';
      await supportRepository.save(ticket);

      await notificationService.notify({
        userId: ticket.user.id,
        type: 'support',
        title: 'Ticket Assigned',
        message: `Your support ticket has been assigned to an admin`
      });

      res.json({
        success: true,
        ticket
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to assign ticket' });
    }
  },

  async updateTicketStatus(req: AuthenticatedRequest, res: Response) {
    const notificationService = new NotificationService(req.app.get('socketService'));
    try {
      const { ticketId } = req.params;
      const { status } = req.body;

      const ticket = await supportRepository.findOne({
        where: { id: ticketId },
        relations: ['user']
      });

      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
      }

      ticket.status = status;
      await supportRepository.save(ticket);

      await notificationService.notify({
        userId: ticket.user.id,
        type: 'support',
        title: 'Ticket Status Updated',
        message: `Your support ticket status has been updated to ${status}`
      });

      res.json({
        success: true,
        ticket
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update ticket status' });
    }
  }
};

