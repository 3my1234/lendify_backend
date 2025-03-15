import { Router, Request, Response, NextFunction } from 'express';
import { auth } from '../middleware/auth';
import { paymentController } from '../controllers/paymentController';
import { validatePaymentInit } from '../middleware/validationSchemas';
import { validate } from '../middleware/validate';

const router = Router();

const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req as any, res, next)).catch(next);
};

router.post(
  '/crypto/deposit',
  auth,
  validate(validatePaymentInit),
  asyncHandler(paymentController.initiateCryptoDeposit)
);

router.post(
  '/crypto/verify/:paymentId',
  auth,
  asyncHandler(paymentController.verifyPayment)
);

router.post(
  '/crypto/cancel/:paymentId',
  auth,
  asyncHandler(paymentController.cancelPayment)
);

router.get(
  '/transactions',
  auth,
  asyncHandler(paymentController.getTransactions)
);

router.post('/crypto/calculate', auth, asyncHandler(paymentController.calculateCryptoAmount));


router.get(
  '/transaction/:reference',
  auth,
  asyncHandler(paymentController.getTransactionStatus)
);

router.post(
  '/webhook/nowpayments',
  asyncHandler(paymentController.handlePaymentWebhook)
);

export default router;
