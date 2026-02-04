import { Router } from 'express';
import { RoleController } from '../controllers/role.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// List all roles
router.get('/', RoleController.findAll);

// Get role by ID
router.get('/:id', RoleController.findById);

export default router;
