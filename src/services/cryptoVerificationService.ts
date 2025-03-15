import axios from 'axios';
import { env } from '../config/env.config';
import { nowPaymentsService } from './nowPaymentsService';

interface PaymentVerification {
  status: string;
  actualAmount: number;
  expectedAmount: number;
  verified: boolean;
}

export const cryptoVerificationService = {
  async verifyTransaction(
    paymentId: string,
    expectedAmount: number
  ): Promise<PaymentVerification> {
    try {
      const paymentStatus = await nowPaymentsService.getPaymentStatus(paymentId);
      
      return {
        status: paymentStatus.payment_status,
        actualAmount: paymentStatus.price_amount,
        expectedAmount: expectedAmount,
        verified: 
          paymentStatus.payment_status === 'finished' && 
          Math.abs(paymentStatus.price_amount - expectedAmount) < 0.01
      };
    } catch (error) {
      console.error('Payment verification error:', error);
      throw new Error('Failed to verify payment');
    }
  },

  async getExchangeRates(currency: string) {
    try {
      const response = await axios.get('https://api.nowpayments.io/v1/currencies', {
        headers: { 'x-api-key': env.NOWPAYMENTS_API_KEY }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error);
      throw new Error('Failed to fetch exchange rates');
    }
  }
  
};
