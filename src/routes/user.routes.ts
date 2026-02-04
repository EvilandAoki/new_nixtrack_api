import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// List all users (filtered by client_id for non-admins)
router.get('/', UserController.findAll);

// Create new user
router.post(
  '/',
  validate({
    name: { required: true, type: 'string', minLength: 2 },
    email: { required: true, type: 'email' },
    password: { required: true, type: 'string', minLength: 6 },
    document_id: { required: false, type: 'string' },
    phone: { required: false, type: 'string' },
    client_id: { required: false, type: 'number' },
    position: { required: false, type: 'string' },
    city_code: { required: false, type: 'string' },
    role_id: { required: false, type: 'number' },
  }),
  UserController.create
);

// Get user by ID
router.get('/:id', UserController.findById);

// Update user
router.put(
  '/:id',
  validate({
    name: { required: false, type: 'string', minLength: 2 },
    email: { required: false, type: 'email' },
    password: { required: false, type: 'string', minLength: 6 },
    document_id: { required: false, type: 'string' },
    phone: { required: false, type: 'string' },
    position: { required: false, type: 'string' },
  }),
  UserController.update
);

// Soft delete (deactivate) user
router.delete('/:id', UserController.delete);

// Reactivate user (admin only)
router.patch('/:id/activate', UserController.activate);

export default router;
