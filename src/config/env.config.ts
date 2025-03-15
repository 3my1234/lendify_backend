import { config as dotenvConfig } from 'dotenv';
import path from 'path';

dotenvConfig({ path: path.resolve(__dirname, '../../.env') });


if (!process.env.NOWPAYMENTS_API_KEY || !process.env.NOWPAYMENTS_IPN_SECRET) {
  throw new Error('NOWPayments configuration is missing');
}


export const env = {
  PORT: process.env.PORT || 5001,
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '5432'),
  DB_USERNAME: process.env.DB_USERNAME || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME || 'baze_db',
  SECRET: process.env.SECRET,
  AUTH_EMAIL: process.env.AUTH_EMAIL,
  AUTH_PASS: process.env.AUTH_PASS,
  FRONTEND_URL: process.env.FRONTEND_URL,
  BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:5001',
  NODE_ENV: process.env.NODE_ENV,
  TRUSTED_ORIGINS: process.env.TRUSTED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
  NOWPAYMENTS_API_KEY: process.env.NOWPAYMENTS_API_KEY,
  NOWPAYMENTS_PUBLIC_KEY: process.env.NOWPAYMENTS_PUBLIC_KEY,
  NOWPAYMENTS_IPN_SECRET: process.env.NOWPAYMENTS_IPN_SECRET
};
