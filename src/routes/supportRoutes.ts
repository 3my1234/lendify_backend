import { Router, Request, Response, NextFunction } from 'express';
import { auth } from '../middleware/auth';
import { supportController } from '../controllers/supportController';

const router = Router();

const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req as any, res, next)).catch(next);
};

router.post('/ticket', auth, asyncHandler(supportController.createTicket));
router.get('/tickets', auth, asyncHandler(supportController.getTickets));
router.get('/ticket/:ticketId', auth, asyncHandler(supportController.getTicketById));
router.put('/ticket/:ticketId', auth, asyncHandler(supportController.updateTicket));

// Admin routes
router.get('/admin/tickets', auth, asyncHandler(supportController.getAllTickets));
router.put('/admin/ticket/:ticketId/assign', auth, asyncHandler(supportController.assignTicket));
router.put('/admin/ticket/:ticketId/status', auth, asyncHandler(supportController.updateTicketStatus));

export default router;
