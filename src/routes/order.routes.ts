import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { OrderDetailController } from '../controllers/orderDetail.controller';
import { FileController } from '../controllers/file.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { upload } from '../middlewares/upload.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Order routes
// List all orders (filtered by client for non-admins)
router.get('/', OrderController.findAll);

// Get order by ID (with details and files)
router.get('/:id', OrderController.findById);

// Create order
router.post(
  '/',
  validate({
    client_id: { required: true, type: 'number' },
    order_number: { required: true, type: 'string', minLength: 1 },
    vehicle_id: { required: false, type: 'number' },
    manifest_number: { required: false, type: 'string' },
    insurance_company: { required: false, type: 'string' },
    origin_city_code: { required: false, type: 'string' },
    destination_city_code: { required: false, type: 'string' },
    route_description: { required: false, type: 'string' },
    distance_km: { required: false, type: 'number' },
    estimated_time: { required: false, type: 'string' },
    restrictions: { required: false, type: 'string' },
    tracking_link: { required: false, type: 'string' },
    notes: { required: false, type: 'string' },
    driver_name: { required: false, type: 'string' },
    driver_mobile: { required: false, type: 'string' },
    escort_id: { required: false, type: 'number' },
  }),
  OrderController.create
);

// Update order
router.put(
  '/:id',
  validate({
    vehicle_id: { required: false, type: 'number' },
    manifest_number: { required: false, type: 'string' },
    insurance_company: { required: false, type: 'string' },
    origin_city_code: { required: false, type: 'string' },
    destination_city_code: { required: false, type: 'string' },
    route_description: { required: false, type: 'string' },
    distance_km: { required: false, type: 'number' },
    estimated_time: { required: false, type: 'string' },
    restrictions: { required: false, type: 'string' },
    tracking_link: { required: false, type: 'string' },
    notes: { required: false, type: 'string' },
    driver_name: { required: false, type: 'string' },
    driver_mobile: { required: false, type: 'string' },
    escort_id: { required: false, type: 'number' },
  }),
  OrderController.update
);

// Update order status
router.patch(
  '/:id/status',
  validate({
    status_id: { required: true, type: 'number' },
  }),
  OrderController.updateStatus
);

// Specialized status updates
router.put('/:id/activate', OrderController.activate);
router.put('/:id/finalize', OrderController.finalize);
router.put('/:id/cancel', OrderController.cancel);

// Check order number exists
router.get('/check-order-number/:orderNumber', OrderController.checkOrderNumber);

// Soft delete order
router.delete('/:id', OrderController.delete);

// Order detail routes (nested under orders)
// List all details for an order
router.get('/:orderId/details', OrderDetailController.findByOrderId);

// Get detail by ID
router.get('/:orderId/details/:id', OrderDetailController.findById);

// Create detail (report)
router.post(
  '/:orderId/details',
  validate({
    location_name: { required: true, type: 'string', minLength: 1 },
    notes: { required: false, type: 'string' },
    latitude: { required: false, type: 'number' },
    longitude: { required: false, type: 'number' },
  }),
  OrderDetailController.create
);

// Update detail
router.put(
  '/:orderId/details/:id',
  validate({
    location_name: { required: false, type: 'string', minLength: 1 },
    notes: { required: false, type: 'string' },
    latitude: { required: false, type: 'number' },
    longitude: { required: false, type: 'number' },
  }),
  OrderDetailController.update
);

// Soft delete detail
router.delete('/:orderId/details/:id', OrderDetailController.delete);

// Order file routes
router.post('/:id/files', upload.single('file'), FileController.uploadOrderFile);
router.delete('/:id/files/:fileId', FileController.deleteOrderFile);

// Order detail file routes
router.post('/:orderId/details/:id/files', upload.single('file'), FileController.uploadOrderDetailFile);
router.delete('/:orderId/details/:id/files/:fileId', FileController.deleteOrderDetailFile);

export default router;
