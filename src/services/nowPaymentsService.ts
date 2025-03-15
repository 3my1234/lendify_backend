import axios from 'axios';
import { createHmac } from 'crypto';
import { env } from '../config/env.config';
import { generateReference } from '../utils/helpers';

// Add type for Axios error
type AxiosErrorResponse = {
  response?: {
    data?: {
      message?: string;
    };
    status?: number;
  };
  message: string;
};

interface PaymentResponse {
  payment_id: string;
  payment_status: string;
  pay_address: string;
  payment_url: string;  // Added this field
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  pay_currency: string;
  order_id: string;
  order_description: string;
}

interface EstimateResponse {
  estimated_amount: number;
  currency_from: string;
  currency_to: string;
  rate: number;
}

const nowPaymentsApi = axios.create({
  baseURL: 'https://api.nowpayments.io/v1',
  headers: {
    'x-api-key': env.NOWPAYMENTS_API_KEY
  }
});

export type { PaymentResponse };

export const nowPaymentsService = {
  async calculateCryptoAmount(lendAmount: number): Promise<{
    usdAmount: number;
    cryptoAmount: number;
    cryptoPrice: number;
  }> {
    const usdAmount = lendAmount / 2;
    
    try {
      const response = await nowPaymentsApi.get<EstimateResponse>(
        `/estimate?amount=${usdAmount}&currency_from=USD&currency_to=BTC`
      );
      
      return {
        usdAmount,
        cryptoAmount: response.data.estimated_amount,
        cryptoPrice: response.data.rate
      };
    } catch (error) {
      console.error('Crypto calculation error:', error);
      throw new Error('Failed to calculate crypto amount');
    }
  },

  async createPayment(amount: number, lendi_amount: number): Promise<PaymentResponse> {
    try {
      // Convert LENDI to USD (since 2 LENDI = 1 USD)
      const usdAmount = amount / 2;
      
      const estimateResponse = await nowPaymentsApi.get<EstimateResponse>(
        `/estimate?amount=${usdAmount}&currency_from=USD&currency_to=BTC`
      );
      
      const payload = {
        price_amount: usdAmount,  // Using USD amount here
        price_currency: 'USD',
        pay_currency: 'BTC',
        order_id: generateReference(),
        order_description: `Purchase ${amount} LENDI tokens`,
        ipn_callback_url: `${env.BACKEND_URL}/api/payments/webhook/nowpayments`,
        success_url: `${env.FRONTEND_URL}/dashboard`,
        cancel_url: `${env.FRONTEND_URL}/dashboard/deposit`
      };
  
      const response = await nowPaymentsApi.post<PaymentResponse>('/payment', payload);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosErrorResponse;
      console.error('NOWPayments create payment error:', {
        message: axiosError.message,
        response: axiosError.response?.data,
        status: axiosError.response?.status
      });
      
      throw new Error(axiosError.response?.data?.message || 'Failed to create payment');
    }
  },

  async verifyPaymentSignature(payload: any, signature: string): Promise<boolean> { // Fixed return type
    try {
      const sortedPayload = Object.keys(payload)
        .sort()
        .reduce((result: any, key) => {
          result[key] = payload[key];
          return result;
        }, {});

      const stringifiedPayload = JSON.stringify(sortedPayload);
      const expectedSignature = createHmac('sha512', env.NOWPAYMENTS_IPN_SECRET) // Using imported createHmac
        .update(stringifiedPayload)
        .digest('hex');

      return expectedSignature === signature;
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  },

  async getPaymentStatus(paymentId: string): Promise<PaymentResponse> {
    try {
      const response = await nowPaymentsApi.get<PaymentResponse>(`/payment/${paymentId}`);
      
      if (!response.data) throw new Error('No response data from NOWPayments');
      
      return response.data;
    } catch (error: any) {
      console.error('Payment status check error:', error.response?.data || error.message);
      throw new Error('Failed to check payment status');
    }
  }
  
};
