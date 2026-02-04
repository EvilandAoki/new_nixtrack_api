import { Router } from 'express';
import { CatalogController } from '../controllers/catalog.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Departments
router.get('/departments', CatalogController.getDepartments);
router.get('/departments/:id', CatalogController.getDepartmentById);

// Cities
router.get('/cities', CatalogController.getCities);
router.get('/cities/:id', CatalogController.getCityById);

// Statuses
router.get('/statuses', CatalogController.getStatuses);
router.get('/statuses/:id', CatalogController.getStatusById);

export default router;
