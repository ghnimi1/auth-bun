import { Router } from 'express'
import { CategoryController } from '../controllers/categoryController'
import { authenticate } from '../middleware/auth'

const router = Router()

// All category routes require authentication
router.use(authenticate)

// Get statistics (before :id to avoid conflicts)
router.get('/statistics', CategoryController.getStatistics)

// Get by slug
router.get('/slug/:slug', CategoryController.getBySlug)

// Get all categories
router.get('/', CategoryController.getAll)

// Create new category
router.post('/', CategoryController.create)

// Get single category by ID
router.get('/:id', CategoryController.getById)

// Update category
router.put('/:id', CategoryController.update)

// Deactivate category (soft delete)
router.patch('/:id/deactivate', CategoryController.deactivate)

// Activate category
router.patch('/:id/activate', CategoryController.activate)

// Delete category permanently
router.delete('/:id', CategoryController.delete)

export default router
