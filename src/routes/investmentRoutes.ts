import { Router, Request, Response, NextFunction } from 'express';
import { auth } from '../middleware/auth';
import { investmentController } from '../controllers/investmentController';
import { validate } from '../middleware/validate';
import { validateInvestment } from '../middleware/validationSchemas';

const router = Router();

const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req as any, res, next)).catch(next);
};

router.post(
  '/create',
  auth,
  validate(validateInvestment),
  asyncHandler(investmentController.createInvestment)
);

router.get(
  '/active',
  auth,
  asyncHandler(investmentController.getInvestments)
);

export default router;
