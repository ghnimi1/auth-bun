import { Router } from 'express';
import { BatchController } from '../controllers/batchController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All batch routes require authentication
router.use(authenticate);

// GET all batches (with optional filters)
router.get('/', BatchController.getAll);

// GET batches for a specific product
router.get('/product/:productId', BatchController.getByProduct);

// GET expiring soon batches
router.get('/status/expiring-soon', BatchController.getExpiringSoon);

// GET expired batches
router.get('/status/expired', BatchController.getExpired);

// GET single batch by ID
router.get('/:id', BatchController.getById);

// POST create new batch
router.post('/', BatchController.create);

// PUT update batch
router.put('/:id', BatchController.update);

// PATCH open batch
router.patch('/:id/open', BatchController.open);

// DELETE batch
router.delete('/:id', BatchController.delete);

export default router;
