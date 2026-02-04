import { Router } from 'express';
import { HealthController } from '../controllers/health.controller';

const router = Router();

router.get('/', HealthController.check);
router.get('/db', HealthController.checkDatabase);
router.get('/db/detailed', HealthController.checkDatabaseDetailed);

export default router;
