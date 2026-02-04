import { Router } from 'express';
import { AgentController } from '../controllers/agent.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// List all agents (filtered by client for non-admins)
router.get('/', AgentController.findAll);

// Get agent by ID
router.get('/:id', AgentController.findById);

// Create agent
router.post(
  '/',
  validate({
    name: { required: true, type: 'string', minLength: 2 },
    document_id: { required: false, type: 'string' },
    mobile: { required: false, type: 'string' },
    vehicle_id: { required: false, type: 'number' },
  }),
  AgentController.create
);

// Update agent
router.put(
  '/:id',
  validate({
    name: { required: false, type: 'string', minLength: 2 },
    document_id: { required: false, type: 'string' },
    mobile: { required: false, type: 'string' },
    vehicle_id: { required: false, type: 'number' },
  }),
  AgentController.update
);

// Soft delete agent
router.delete('/:id', AgentController.delete);

export default router;
