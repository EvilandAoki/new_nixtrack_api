import { Router } from 'express';
import { ClientController } from '../controllers/client.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// List all clients (admin sees all, non-admin sees own client)
router.get('/', ClientController.findAll);

// Get client by ID
router.get('/:id', ClientController.findById);

// Create client (admin only)
router.post(
  '/',
  validate({
    company_name: { required: true, type: 'string', minLength: 2 },
    tax_id: { required: true, type: 'string', minLength: 1 },
    phone: { required: false, type: 'string' },
    address: { required: false, type: 'string' },
    email: { required: false, type: 'email' },
  }),
  ClientController.create
);

// Update client (admin only)
router.put(
  '/:id',
  validate({
    company_name: { required: false, type: 'string', minLength: 2 },
    tax_id: { required: false, type: 'string', minLength: 1 },
    phone: { required: false, type: 'string' },
    address: { required: false, type: 'string' },
    email: { required: false, type: 'email' },
  }),
  ClientController.update
);

// Soft delete client (admin only)
router.delete('/:id', ClientController.delete);

export default router;
