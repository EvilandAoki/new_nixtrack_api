import { Router } from 'express';
import { AgentController } from '../controllers/agent.controller';
import { FileController } from '../controllers/file.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { upload } from '../middlewares/upload.middleware';

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

// Agent file routes
router.post('/:id/files', upload.single('file'), FileController.uploadAgentFile);
router.delete('/:id/files/:fileId', FileController.deleteAgentFile);
router.put('/:id/files/:fileId/main', FileController.setMainAgentPhoto);

export default router;
