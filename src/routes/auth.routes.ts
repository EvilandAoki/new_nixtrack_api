import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';

const router = Router();

// Public registration (for self-registration if allowed)
router.post(
  '/register',
  validate({
    name: { required: true, type: 'string', minLength: 2 },
    email: { required: true, type: 'email' },
    password: { required: true, type: 'string', minLength: 6 },
    document_id: { required: false, type: 'string' },
    phone: { required: false, type: 'string' },
    position: { required: false, type: 'string' },
  }),
  AuthController.register
);

// Login
router.post(
  '/login',
  validate({
    email: { required: true, type: 'email' },
    password: { required: true, type: 'string' },
  }),
  AuthController.login
);

// Get current user profile
router.get('/profile', authMiddleware, AuthController.profile);

export default router;
