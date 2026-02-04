import { Router } from 'express';
import { VehicleController } from '../controllers/vehicle.controller';
import { FileController } from '../controllers/file.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { upload } from '../middlewares/upload.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// List all vehicles (filtered by client for non-admins)
router.get('/', VehicleController.findAll);

// Get vehicle by ID (with files)
router.get('/:id', VehicleController.findById);

// Get vehicle order history
router.get('/:id/history', VehicleController.getHistory);

// Create vehicle
router.post(
  '/',
  validate({
    client_id: { required: true, type: 'number' },
    license_plate: { required: true, type: 'string', minLength: 1 },
    brand: { required: false, type: 'string' },
    vehicle_type: { required: false, type: 'string' },
    model_year: { required: false, type: 'string' },
    color: { required: false, type: 'string' },
    capacity: { required: false, type: 'string' },
    container: { required: false, type: 'string' },
    serial_numbers: { required: false, type: 'string' },
  }),
  VehicleController.create
);

// Update vehicle
router.put(
  '/:id',
  validate({
    brand: { required: false, type: 'string' },
    vehicle_type: { required: false, type: 'string' },
    model_year: { required: false, type: 'string' },
    color: { required: false, type: 'string' },
    capacity: { required: false, type: 'string' },
    container: { required: false, type: 'string' },
    serial_numbers: { required: false, type: 'string' },
  }),
  VehicleController.update
);

// Soft delete vehicle
router.delete('/:id', VehicleController.delete);

// Vehicle file routes
router.post('/:id/files', upload.single('file'), FileController.uploadVehicleFile);
router.delete('/:id/files/:fileId', FileController.deleteVehicleFile);
router.put('/:id/files/:fileId/main', FileController.setMainVehiclePhoto);

export default router;
