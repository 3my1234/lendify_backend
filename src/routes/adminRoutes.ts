import express, { Request, Response, NextFunction } from 'express';
import { adminController } from '../controllers/adminController';
import { adminAuth } from '../middleware/auth';

const router = express.Router();

const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Super Admin Routes
router.post(
  '/create-super-admin', 
  asyncHandler(adminController.createSuperAdmin)
);

router.post(
  '/invite', 
  adminAuth, 
  asyncHandler(adminController.sendAdminInvite) // Changed from inviteAdmin
);

router.get(
  '/verify-invite', 
  asyncHandler((req: Request, res: Response) => adminController.verifyInviteToken(req, res))
);

router.post(
  '/complete-registration',
  asyncHandler(adminController.completeAdminRegistration) // Changed from completeRegistration
);

router.get(
  '/list', 
  adminAuth, 
  asyncHandler(adminController.getAdminList)
);

router.delete(
  '/:adminId', 
  adminAuth, 
  asyncHandler(adminController.removeAdmin)
);

router.get(
  '/users/list',
  adminAuth,
  asyncHandler(adminController.getUserList)
);

router.get(
  '/settings',
  adminAuth,
  asyncHandler(adminController.getAdminSettings)
);

router.get('/dashboard/stats', adminAuth, asyncHandler(adminController.getDashboardStats));
router.get('/investments/reports', adminAuth, asyncHandler(adminController.getInvestmentReports));
router.get('/referrals/stats', adminAuth, asyncHandler(adminController.getReferralStats));

export default router;
