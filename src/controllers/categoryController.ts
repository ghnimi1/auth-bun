import type { Request, Response, NextFunction } from 'express'
import { Category, type ICategory } from '../models/category'
import { Logger } from '../utils/logger'

export class CategoryController {
  /**
   * Get all categories with optional filtering and pagination
   * GET /api/categories
   */
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, isActive = true, sortBy = 'displayOrder', order = 'asc', page = 1, limit = 50 } = req.query

      const skip = (Number(page) - 1) * Number(limit)
      const sortOrder: 1 | -1 = order === 'desc' ? -1 : 1

      // Build query
      const query: any = {}

      if (isActive !== undefined) {
        query.isActive = isActive === 'true'
      }

      if (search) {
        query.$text = { $search: String(search) }
      }

      // Execute query
      const categories = await Category.find(query)
        .sort({ [String(sortBy)]: sortOrder })
        .skip(skip)
        .limit(Number(limit))
        .exec()

      const total = await Category.countDocuments(query)

      Logger.info('Categories retrieved', {
        count: categories.length,
        total,
        search,
      })

      res.json({
        success: true,
        data: categories,
        count: categories.length,
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      })
    } catch (error) {
      console.log(error)
    }
  }

  /**
   * Get a single category by ID
   * GET /api/categories/:id
   */
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params

      const category = await Category.findById(id)

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Catégorie non trouvée',
        })
      }

      Logger.info('Category retrieved', { categoryId: id })

      res.json({
        success: true,
        data: category,
      })
    } catch (error) {
      console.log(error)
    }
  }

  /**
   * Get category by slug
   * GET /api/categories/slug/:slug
   */
  static async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params

      const category = await Category.findOne({ slug })

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Catégorie non trouvée',
        })
      }

      Logger.info('Category retrieved by slug', { slug })

      res.json({
        success: true,
        data: category,
      })
    } catch (error) {
      console.log(error)
    }
  }

  /**
   * Create a new category
   * POST /api/categories
   */
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, slug, description, icon, color, displayOrder, isActive } = req.body

      // Validation
      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Le nom de la catégorie est obligatoire',
        })
      }

      // Check if slug already exists
      if (slug) {
        const existingCategory = await Category.findOne({ slug })
        if (existingCategory) {
          return res.status(400).json({
            success: false,
            message: 'Ce slug est déjà utilisé',
          })
        }
      }

      // Create category
      const category = new Category({
        name: name.trim(),
        slug,
        description,
        icon,
        color,
        displayOrder: displayOrder || 0,
        isActive: isActive !== undefined ? isActive : true,
      })

      await category.save()

      Logger.info('Category created', {
        categoryId: category._id,
        name: category.name,
      })

      res.status(201).json({
        success: true,
        message: 'Catégorie créée avec succès',
        data: category,
      })
    } catch (error: any) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Erreur de validation',
          errors: Object.values(error.errors).map((e: any) => e.message),
        })
      }
      console.log(error)
    }
  }

  /**
   * Update a category
   * PUT /api/categories/:id
   */
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const { name, slug, description, icon, color, displayOrder, isActive } = req.body

      // Check if category exists
      const category = await Category.findById(id)

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Catégorie non trouvée',
        })
      }

      // Check if new slug is already used by another category
      if (slug && slug !== category.slug) {
        const existingCategory = await Category.findOne({ slug })
        if (existingCategory) {
          return res.status(400).json({
            success: false,
            message: 'Ce slug est déjà utilisé',
          })
        }
      }

      // Update fields
      if (name !== undefined) category.name = name.trim()
      if (slug !== undefined) category.slug = slug
      if (description !== undefined) category.description = description
      if (icon !== undefined) category.icon = icon
      if (color !== undefined) category.color = color
      if (displayOrder !== undefined) category.displayOrder = displayOrder
      if (isActive !== undefined) category.isActive = isActive

      await category.save()

      Logger.info('Category updated', {
        categoryId: id,
        name: category.name,
      })

      res.json({
        success: true,
        message: 'Catégorie mise à jour avec succès',
        data: category,
      })
    } catch (error: any) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Erreur de validation',
          errors: Object.values(error.errors).map((e: any) => e.message),
        })
      }
      console.log(error)
    }
  }

  /**
   * Delete a category
   * DELETE /api/categories/:id
   */
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params

      const category = await Category.findByIdAndDelete(id)

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Catégorie non trouvée',
        })
      }

      Logger.info('Category deleted', {
        categoryId: id,
        name: category.name,
      })

      res.json({
        success: true,
        message: 'Catégorie supprimée avec succès',
      })
    } catch (error) {
      console.log(error)
    }
  }

  /**
   * Deactivate a category (soft delete)
   * PATCH /api/categories/:id/deactivate
   */
  static async deactivate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params

      const category = await Category.findByIdAndUpdate(id, { isActive: false }, { new: true })

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Catégorie non trouvée',
        })
      }

      Logger.info('Category deactivated', {
        categoryId: id,
        name: category.name,
      })

      res.json({
        success: true,
        message: 'Catégorie désactivée avec succès',
        data: category,
      })
    } catch (error) {
      console.log(error)
    }
  }

  /**
   * Activate a category
   * PATCH /api/categories/:id/activate
   */
  static async activate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params

      const category = await Category.findByIdAndUpdate(id, { isActive: true }, { new: true })

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Catégorie non trouvée',
        })
      }

      Logger.info('Category activated', {
        categoryId: id,
        name: category.name,
      })

      res.json({
        success: true,
        message: 'Catégorie activée avec succès',
        data: category,
      })
    } catch (error) {
      console.log(error)
    }
  }

  /**
   * Get statistics about categories
   * GET /api/categories/statistics
   */
  static async getStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const totalCategories = await Category.countDocuments()
      const activeCategories = await Category.countDocuments({ isActive: true })
      const inactiveCategories = await Category.countDocuments({ isActive: false })

      Logger.info('Category statistics retrieved', {
        total: totalCategories,
        active: activeCategories,
        inactive: inactiveCategories,
      })

      res.json({
        success: true,
        data: {
          totalCategories,
          activeCategories,
          inactiveCategories,
        },
      })
    } catch (error) {
      console.log(error)
    }
  }
}
