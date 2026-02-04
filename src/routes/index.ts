import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import roleRoutes from './role.routes';
import healthRoutes from './health.routes';
import catalogRoutes from './catalog.routes';
import clientRoutes from './client.routes';
import vehicleRoutes from './vehicle.routes';
import agentRoutes from './agent.routes';
import orderRoutes from './order.routes';
import orderDetailRoutes from './orderDetail.routes';
import dashboardRoutes from './dashboard.routes';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/roles', roleRoutes);
router.use('/catalog', catalogRoutes);
router.use('/clients', clientRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/agents', agentRoutes);
router.use('/orders', orderRoutes);
router.use('/order-details', orderDetailRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
