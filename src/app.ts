import express from 'express';
import cors from 'cors';
import { env } from './config/env.config';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import paymentRoutes from './routes/paymentRoutes';
import investmentRoutes from './routes/investmentRoutes';
import supportRoutes from './routes/supportRoutes';
import notificationRoutes from './routes/notificationRoutes';
import { AppDataSource } from "./config/data-source";

const app = express();

app.use(express.json());
app.use(cors({ origin: '*', credentials: true }));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/investment', investmentRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/notifications', notificationRoutes); // Add this line

// Initialize PostgreSQL Database Connection
AppDataSource.initialize()
  .then(() => {
    console.log("📦 PostgreSQL Database Connected Successfully!");
  })
  .catch((error) => {
    console.error("❌ Database Connection Failed:", error);
  });

app.use(errorHandler);

export default app;
