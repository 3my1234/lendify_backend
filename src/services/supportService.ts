import { Support } from '../models/Support';
import { Types } from 'mongoose';
import { AppDataSource } from '../config/data-source';

const supportRepository = AppDataSource.getRepository(Support);

export const supportService = {
  async createTicket(userId: string, subject: string, message: string) {
    const ticket = new Support();
    ticket.user = { id: userId } as any;
    ticket.subject = subject;
    ticket.message = message;
    return await supportRepository.save(ticket);
  },

  async addResponse(ticketId: string, from: 'user' | 'admin', message: string) {
    const ticket = await supportRepository.findOne({ where: { id: ticketId } });
    if (!ticket) throw new Error('Ticket not found');

    const response = {
      user_id: from === 'user' ? ticket.user.id : 'admin',
      message,
      timestamp: new Date()
    };

    ticket.replies = [...ticket.replies, response];
    return await supportRepository.save(ticket);
  }
};
