import express, { Request, Response, NextFunction } from 'express';
import { authController } from '../controllers/authController';
import { auth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { registerValidation, loginValidation } from '../middleware/validationSchemas';

const router = express.Router();

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};


// Public routes
router.post('/register', 
  validate(registerValidation),
  asyncHandler(authController.register)
);

router.post('/login', 
  validate(loginValidation),
  asyncHandler(authController.login)
);

router.post('/logout', 
  auth, 
  asyncHandler(authController.logout)
);


router.post('/verify-email/:token', 
  asyncHandler(authController.verifyEmail)
);

router.post('/forgot-password', 
  asyncHandler(authController.forgotPassword)
);

router.post('/reset-password', 
  asyncHandler(authController.resetPassword)
);

router.post('/resend-verification', 
  asyncHandler(authController.resendVerification)
);

// Protected routes
router.get('/me', 
  auth, 
  asyncHandler(authController.getCurrentUser)
);

router.put('/update-profile', 
  auth, 
  asyncHandler(authController.updateProfile)
);

router.get('/me/profile', 
  auth, 
  asyncHandler(authController.getProfile)
);

router.put('/me/profile', 
  auth, 
  asyncHandler(authController.updateProfile)
);

export default router;
