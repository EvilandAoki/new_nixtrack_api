import { Router } from 'express';
import { OrderDetailController } from '../controllers/orderDetail.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// These routes match what new_nixtrack_web/src/api/services/order-detail.service.ts expects

// GET /api/order-details/:orderId
router.get('/:orderId', OrderDetailController.findByOrderId);

// GET /api/order-details/detail/:id
router.get('/detail/:id', OrderDetailController.findById);

// POST /api/order-details
router.post(
    '/',
    validate({
        shipment_id: { required: true, type: 'number' },
        location_name: { required: true, type: 'string', minLength: 1 },
        notes: { required: false, type: 'string' },
        latitude: { required: false, type: 'number' },
        longitude: { required: false, type: 'number' },
        sequence_number: { required: false, type: 'number' },
    }),
    OrderDetailController.create
);

// PUT /api/order-details/:id
router.put(
    '/:id',
    validate({
        location_name: { required: false, type: 'string', minLength: 1 },
        notes: { required: false, type: 'string' },
        latitude: { required: false, type: 'number' },
        longitude: { required: false, type: 'number' },
        sequence_number: { required: false, type: 'number' },
    }),
    OrderDetailController.update
);

// DELETE /api/order-details/:id
router.delete('/:id', OrderDetailController.delete);

export default router;
