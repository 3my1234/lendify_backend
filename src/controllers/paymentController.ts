import { Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { Transaction } from '../models/Transaction';
import { User } from '../models/User';
import { nowPaymentsService } from '../services/nowPaymentsService';
import { cryptoVerificationService } from '../services/cryptoVerificationService';
import { PaymentResponse } from '../services/nowPaymentsService';
import { NotificationService } from '../services/notificationService';
import { generateReference } from '../utils/helpers';
import { env } from '../config/env.config';

interface PaymentDetails {
  payment_id: string;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  pay_currency: string;
  order_id: string;
  order_description: string;
}

const transactionRepository = AppDataSource.getRepository(Transaction);
const userRepository = AppDataSource.getRepository(User);
const LENDI_RATE = 2; // 1 USD = 2 LENDI

interface AuthenticatedRequest extends Request {
  user: User;
  userId: string;
}

export const paymentController = {
  async initiateCryptoDeposit(req: AuthenticatedRequest, res: Response) {
    const notificationService = new NotificationService(req.app.get('socketService'));
    try {
      const { amount } = req.body;
      const userId = req.user.id;

      const paymentDetails = await nowPaymentsService.createPayment(amount, amount);

      const transaction = transactionRepository.create({
        user: { id: userId },
        type: 'deposit',
        amount: amount,
        status: 'pending',
        reference: paymentDetails.payment_id,
        crypto_details: {
          type: paymentDetails.pay_currency,
          amount: paymentDetails.pay_amount,
          wallet_address: paymentDetails.pay_address
        }
      });

      await transactionRepository.save(transaction);

      await notificationService.notify({
        userId,
        type: 'transaction',
        title: 'Transaction Initiated',
        message: `Your deposit of ${amount} LENDI is pending`
      });

      res.status(201).json({
        success: true,
        payment_details: {
          ...paymentDetails,
          payment_url: paymentDetails.payment_url
        }
      });
    } catch (error) {
      console.error('Deposit initiation error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to initiate deposit'
      });
    }
  },

  async verifyPayment(req: AuthenticatedRequest, res: Response) {
    const notificationService = new NotificationService(req.app.get('socketService'));
    try {
      const { paymentId } = req.params;
      
      const transaction = await transactionRepository.findOne({
        where: { reference: paymentId },
        relations: ['user']
      });

      if (!transaction || !transaction.crypto_details) {
        return res.status(404).json({ error: 'Transaction not found or invalid' });
      }

      const verification = await cryptoVerificationService.verifyTransaction(
        paymentId,
        transaction.crypto_details.amount
      );

      if (verification.verified) {
        transaction.status = 'completed';
        await transactionRepository.save(transaction);

        await userRepository.update(
          { id: transaction.user.id },
          { investment_balance: () => `investment_balance + ${transaction.amount}` }
        );

        await notificationService.notify({
          userId: transaction.user.id,
          type: 'transaction',
          title: 'Transaction Completed',
          message: `Your deposit of ${transaction.amount} LENDI has been completed successfully`
        });

        return res.json({
          success: true,
          message: 'Payment verified successfully'
        });
      }

      res.json({
        success: false,
        status: verification.status
      });
    } catch (error) {
      console.error('Payment verification error:', error);
      res.status(500).json({ error: 'Verification failed' });
    }
  },

  async cancelPayment(req: AuthenticatedRequest, res: Response) {
    const notificationService = new NotificationService(req.app.get('socketService'));
    const socketService = req.app.get('socketService');
    
    try {
      const { paymentId } = req.params;
      const userId = req.user.id;
  
      const transaction = await transactionRepository.findOne({
        where: { 
          reference: paymentId,
          user: { id: userId }
        }
      });
  
      if (!transaction) {
        return res.status(404).json({ 
          success: false,
          error: 'Transaction not found' 
        });
      }
  
      transaction.status = 'cancelled';
      await transactionRepository.save(transaction);
  
      // Create notification in database
      await notificationService.notify({
        userId,
        type: 'transaction',
        title: 'Transaction Cancelled',
        message: `Your deposit of ${transaction.amount} LENDI has been cancelled`,
        referenceId: transaction.reference
      });
  
      // Explicitly send WebSocket notification
      if (socketService) {
        socketService.notifyUser(userId.toString(), {
          type: 'transaction',
          title: 'Transaction Cancelled',
          message: `Your deposit of ${transaction.amount} LENDI has been cancelled`,
          timestamp: new Date(),
          referenceId: transaction.reference,
          status: 'cancelled'
        });
      }
  
      return res.json({
        success: true,
        message: 'Payment cancelled successfully'
      });
    } catch (error) {
      console.error('Payment cancellation error:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to cancel payment' 
      });
    }
  },


  async calculateCryptoAmount(req: AuthenticatedRequest, res: Response) {
    try {
      const { amount } = req.body;
      const calculation = await nowPaymentsService.calculateCryptoAmount(amount);
      
      res.json({
        success: true,
        ...calculation
      });
    } catch (error) {
      console.error('Crypto calculation error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to calculate crypto amount' 
      });
    }
  },

  async getTransactionStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { reference } = req.params;
      const transaction = await transactionRepository.findOne({
        where: { reference },
        relations: ['user']
      });

      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      res.json({
        success: true,
        transaction
      });
    } catch (error) {
      console.error('Transaction status fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch transaction status' });
    }
  },

  async handlePaymentWebhook(req: Request, res: Response) {
    const notificationService = new NotificationService(req.app.get('socketService'));
    try {
      const signature = req.headers['x-nowpayments-sig'];
      if (!signature || typeof signature !== 'string') {
        return res.status(401).json({ error: 'Invalid signature' });
      }
  
      const isValid = await nowPaymentsService.verifyPaymentSignature(req.body, signature);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }
  
      const { payment_id, payment_status, price_amount } = req.body;
  
      if (payment_status === 'finished') {
        const transaction = await transactionRepository.findOne({
          where: { reference: payment_id },
          relations: ['user']
        });
  
        if (transaction) {
          transaction.status = 'completed';
          await transactionRepository.save(transaction);
  
          await userRepository.update(
            { id: transaction.user.id },
            { investment_balance: () => `investment_balance + ${transaction.amount}` }
          );
  
          await notificationService.notify({
            userId: transaction.user.id,
            type: 'transaction',
            title: 'Deposit Successful',
            message: `Your account has been credited with ${transaction.amount} LENDI`
          });

          const socketService = req.app.get('socketService');
          socketService.notifyUser(transaction.user.id, {
            type: 'transaction',
            title: 'Deposit Successful',
            message: `Your account has been credited with ${transaction.amount} LENDI`
          });
        }
      }
  
      res.json({ status: 'ok' });
    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getTransactions(req: AuthenticatedRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const [transactions, total] = await transactionRepository.findAndCount({
        where: { user: { id: req.userId } },
        order: { createdAt: 'DESC' },
        take: limit,
        skip: skip
      });

      res.json({
        success: true,
        transactions,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      });
    } catch (error) {
      console.error('Transactions fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  }
};
