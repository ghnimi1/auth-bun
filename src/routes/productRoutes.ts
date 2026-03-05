import { Router } from 'express';
import { ProductController } from '../controllers/productController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All product routes require authentication
router.use(authenticate);

// GET all products with filters
router.get('/', ProductController.getAll);

// GET statistics
router.get('/statistics', ProductController.getStatistics);

// GET low stock products
router.get('/low-stock', ProductController.getLowStock);

// GET single product by ID
router.get('/:id', ProductController.getById);

// POST create new product
router.post('/', ProductController.create);

// PUT update product
router.put('/:id', ProductController.update);

// PATCH update quantity
router.patch('/:id/quantity', ProductController.updateQuantity);

// PATCH deactivate product
router.patch('/:id/deactivate', ProductController.deactivate);

// DELETE product
router.delete('/:id', ProductController.delete);

export default router;
