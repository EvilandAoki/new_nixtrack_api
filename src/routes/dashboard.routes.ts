import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get active orders with last report for dashboard
router.get('/', DashboardController.getActiveOrders);

// Get summary statistics
router.get('/summary', DashboardController.getSummary);

export default router;
