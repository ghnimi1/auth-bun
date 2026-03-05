import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Product, type IProduct } from '../models/product';
import { Category } from '../models/category';
import { Logger } from '../utils/logger';
import type { AuthRequest } from '../middleware/auth';

export class ProductController {
  // Get all products
  static async getAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { category, search, isActive = true } = req.query;

      const filter: any = { isActive };

      if (category && category !== 'all') {
        // Valider que category est un ObjectId valide
        if (mongoose.Types.ObjectId.isValid(category as string)) {
          filter.category = new mongoose.Types.ObjectId(category as string);
        } else {
          res.status(400).json({ error: 'Invalid category ID format' });
          return;
        }
      }

      if (search) {
        filter.$text = { $search: search as string };
      }

      const products = await Product.find(filter)
        .populate('category', 'name slug description icon color')
        .sort({ name: 1 });

      res.json({
        success: true,
        data: products,
        count: products.length,
      });

      Logger.info(`Retrieved ${products.length} products`, { filter });
    } catch (error: any) {
      Logger.error('Get products error:', error);
      res.status(500).json({ error: 'Failed to retrieve products' });
    }
  }

  // Get single product
  static async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const product = await Product.findById(id)
        .populate('category', 'name slug description icon color');

      if (!product) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }

      res.json({
        success: true,
        data: product,
      });
    } catch (error: any) {
      Logger.error('Get product error:', error);
      res.status(500).json({ error: 'Failed to retrieve product' });
    }
  }

  // Create product
  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const {
        name,
        category,
        quantity = 0,
        unit,
        minQuantity,
        unitPrice,
        shelfLifeAfterOpening,
        supplier,
      } = req.body;

      // Validate required fields
      if (!name || !category || !unit || minQuantity === undefined || !unitPrice) {
        res.status(400).json({
          error: 'Missing required fields: name, category, unit, minQuantity, unitPrice',
        });
        return;
      }

      // Verify category exists
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        res.status(400).json({
          error: 'Category not found',
        });
        return;
      }

      const product = new Product({
        name,
        category,
        quantity,
        unit,
        minQuantity,
        unitPrice,
        shelfLifeAfterOpening,
        supplier,
        isActive: true,
      });

      await product.save();
      await product.populate('category', 'name slug description icon color');

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: product,
      });

      Logger.info(`Product created: ${product.name}`, { productId: product._id });
    } catch (error: any) {
      Logger.error('Create product error:', error);

      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors)
          .map((e: any) => e.message)
          .join(', ');
        res.status(400).json({ error: messages });
        return;
      }

      res.status(500).json({ error: 'Failed to create product' });
    }
  }

  // Update product
  static async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // If category is being updated, verify it exists
      if (updateData.category) {
        const categoryExists = await Category.findById(updateData.category);
        if (!categoryExists) {
          res.status(400).json({
            error: 'Category not found',
          });
          return;
        }
      }

      const product = await Product.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      }).populate('category', 'name slug description icon color');

      if (!product) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }

      res.json({
        success: true,
        message: 'Product updated successfully',
        data: product,
      });

      Logger.info(`Product updated: ${product.name}`, { productId: product._id });
    } catch (error: any) {
      Logger.error('Update product error:', error);

      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors)
          .map((e: any) => e.message)
          .join(', ');
        res.status(400).json({ error: messages });
        return;
      }

      res.status(500).json({ error: 'Failed to update product' });
    }
  }

  // Delete product
  static async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const product = await Product.findByIdAndDelete(id);

      if (!product) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }

      res.json({
        success: true,
        message: 'Product deleted successfully',
        data: product,
      });

      Logger.info(`Product deleted: ${product.name}`, { productId: product._id });
    } catch (error: any) {
      Logger.error('Delete product error:', error);
      res.status(500).json({ error: 'Failed to delete product' });
    }
  }

  // Soft delete (deactivate)
  static async deactivate(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const product = await Product.findByIdAndUpdate(id, { isActive: false }, { new: true });

      if (!product) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }

      res.json({
        success: true,
        message: 'Product deactivated successfully',
        data: product,
      });

      Logger.info(`Product deactivated: ${product.name}`, { productId: product._id });
    } catch (error: any) {
      Logger.error('Deactivate product error:', error);
      res.status(500).json({ error: 'Failed to deactivate product' });
    }
  }

  // Get low stock products
  static async getLowStock(req: AuthRequest, res: Response): Promise<void> {
    try {
      const products = await Product.find({
        isActive: true,
        $expr: { $lte: ['$quantity', '$minQuantity'] },
      })
        .populate('category', 'name slug description icon color')
        .sort({ quantity: 1 });

      res.json({
        success: true,
        data: products,
        count: products.length,
      });

      Logger.info(`Retrieved ${products.length} low stock products`);
    } catch (error: any) {
      Logger.error('Get low stock products error:', error);
      res.status(500).json({ error: 'Failed to retrieve low stock products' });
    }
  }

  // Update quantity
  static async updateQuantity(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { quantity, adjustment } = req.body;

      let newQuantity: number;

      if (quantity !== undefined) {
        // Set exact quantity
        newQuantity = quantity;
      } else if (adjustment !== undefined) {
        // Adjust quantity by delta
        const product = await Product.findById(id);
        if (!product) {
          res.status(404).json({ error: 'Product not found' });
          return;
        }
        newQuantity = product.quantity + adjustment;
      } else {
        res.status(400).json({ error: 'Either quantity or adjustment must be provided' });
        return;
      }

      if (newQuantity < 0) {
        res.status(400).json({ error: 'Quantity cannot be negative' });
        return;
      }

      const product = await Product.findByIdAndUpdate(
        id,
        { quantity: newQuantity },
        { new: true }
      ).populate('category', 'name slug description icon color');

      if (!product) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }

      res.json({
        success: true,
        message: 'Product quantity updated',
        data: product,
      });

      Logger.info(`Product quantity updated: ${product.name}`, {
        productId: product._id,
        newQuantity,
      });
    } catch (error: any) {
      Logger.error('Update quantity error:', error);
      res.status(500).json({ error: 'Failed to update quantity' });
    }
  }

  // Get statistics
  static async getStatistics(req: AuthRequest, res: Response): Promise<void> {
    try {
      const totalProducts = await Product.countDocuments({ isActive: true });
      const lowStockProducts = await Product.countDocuments({
        isActive: true,
        $expr: { $lte: ['$quantity', '$minQuantity'] },
      });
      const outOfStockProducts = await Product.countDocuments({
        isActive: true,
        quantity: 0,
      });

      const products = await Product.find({ isActive: true });
      const totalValue = products.reduce((sum, p) => sum + p.quantity * p.unitPrice, 0);

      res.json({
        success: true,
        data: {
          totalProducts,
          lowStockProducts,
          outOfStockProducts,
          totalInventoryValue: totalValue,
        },
      });

      Logger.info('Retrieved product statistics');
    } catch (error: any) {
      Logger.error('Get statistics error:', error);
      res.status(500).json({ error: 'Failed to retrieve statistics' });
    }
  }
}
