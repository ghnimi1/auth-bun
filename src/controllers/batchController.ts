import type { Request, Response } from 'express';
import { Batch, type IBatch } from '../models/batch';
import { Product } from '../models/product';
import { Logger } from '../utils/logger';

export class BatchController {
  // GET all batches for a product
  static async getByProduct(req: Request, res: Response): Promise<void> {
    try {
      const { productId } = req.params;

      // Verify product exists
      const product = await Product.findById(productId);
      if (!product) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }

      const batches = await Batch.find({ productId })
        .populate('supplierId', 'name')
        .sort({ receptionDate: -1 });

      res.status(200).json(batches);
    } catch (error) {
      Logger.error('Error fetching batches:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // GET all batches (with optional filters)
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { productId, isOpened } = req.query;

      const filter: any = {};
      if (productId) filter.productId = productId;
      if (isOpened !== undefined) filter.isOpened = isOpened === 'true';

      const batches = await Batch.find(filter)
        .populate('productId', 'name unit')
        .populate('supplierId', 'name')
        .sort({ receptionDate: -1 });

      res.status(200).json(batches);
    } catch (error) {
      Logger.error('Error fetching all batches:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // GET single batch by ID
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const batch = await Batch.findById(id)
        .populate('productId', 'name unit')
        .populate('supplierId', 'name');

      if (!batch) {
        res.status(404).json({ error: 'Batch not found' });
        return;
      }

      res.status(200).json(batch);
    } catch (error) {
      Logger.error('Error fetching batch:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // POST create new batch
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const {
        productId,
        supplierId,
        batchNumber,
        quantity,
        receptionDate,
        productionDate,
        expirationDate,
        notes,
      } = req.body;

      // Validation
      if (!productId || !batchNumber || quantity === undefined || !expirationDate) {
        res.status(400).json({
          error: 'Missing required fields: productId, batchNumber, quantity, expirationDate',
        });
        return;
      }

      // Parse quantity as number
      const parsedQuantity = Number(quantity);
      if (isNaN(parsedQuantity)) {
        res.status(400).json({
          error: 'Quantity must be a valid number',
        });
        return;
      }

      // Verify product exists
      const product = await Product.findById(productId);
      if (!product) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }

      // Check for duplicate batch number within same product
      const existingBatch = await Batch.findOne({ productId, batchNumber });
      if (existingBatch) {
        res.status(400).json({
          error: 'Batch number already exists for this product',
        });
        return;
      }

      // Parse dates safely
      let receptionDateObj;
      let productionDateObj;
      let expirationDateObj;

      try {
        receptionDateObj = new Date(receptionDate);
        if (isNaN(receptionDateObj.getTime())) {
          res.status(400).json({ error: 'Invalid receptionDate format' });
          return;
        }

        if (productionDate) {
          productionDateObj = new Date(productionDate);
          if (isNaN(productionDateObj.getTime())) {
            res.status(400).json({ error: 'Invalid productionDate format' });
            return;
          }
        }

        expirationDateObj = new Date(expirationDate);
        if (isNaN(expirationDateObj.getTime())) {
          res.status(400).json({ error: 'Invalid expirationDate format' });
          return;
        }
      } catch (dateError) {
        Logger.error('Date parsing error:', dateError);
        res.status(400).json({ error: 'Invalid date format' });
        return;
      }

      const batch = new Batch({
        productId,
        supplierId: supplierId || undefined,
        batchNumber,
        quantity: parsedQuantity,
        receptionDate: receptionDateObj,
        productionDate: productionDateObj,
        expirationDate: expirationDateObj,
        isOpened: false,
        notes: notes || undefined,
      });

      await batch.save();
      await batch.populate('supplierId', 'name');

      Logger.info(`Batch created: ${batchNumber} for product ${productId}`);
      res.status(201).json(batch);
    } catch (error) {
      Logger.error('Error creating batch:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // PUT update batch
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { quantity, notes, productionDate } = req.body;

      const batch = await Batch.findById(id);
      if (!batch) {
        res.status(404).json({ error: 'Batch not found' });
        return;
      }

      // Only allow updating specific fields
      if (quantity !== undefined) {
        const parsedQuantity = Number(quantity);
        if (isNaN(parsedQuantity) || parsedQuantity < 0) {
          res.status(400).json({ error: 'Quantity must be a valid non-negative number' });
          return;
        }
        batch.quantity = parsedQuantity;
      }

      if (notes !== undefined) {
        batch.notes = notes;
      }

      if (productionDate !== undefined) {
        try {
          const prodDate = new Date(productionDate);
          if (isNaN(prodDate.getTime())) {
            res.status(400).json({ error: 'Invalid productionDate format' });
            return;
          }
          batch.productionDate = prodDate;
        } catch (error) {
          res.status(400).json({ error: 'Invalid productionDate format' });
          return;
        }
      }

      await batch.save();
      await batch.populate('supplierId', 'name');

      Logger.info(`Batch updated: ${batch.batchNumber}`);
      res.status(200).json(batch);
    } catch (error) {
      Logger.error('Error updating batch:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // PATCH open batch
  static async open(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { openingDate, expirationAfterOpening } = req.body;

      if (!openingDate) {
        res.status(400).json({ error: 'Opening date is required' });
        return;
      }

      const batch = await Batch.findById(id);
      if (!batch) {
        res.status(404).json({ error: 'Batch not found' });
        return;
      }

      if (batch.isOpened) {
        res.status(400).json({ error: 'Batch is already opened' });
        return;
      }

      // Parse opening date
      let openDate;
      try {
        openDate = new Date(openingDate);
        if (isNaN(openDate.getTime())) {
          res.status(400).json({ error: 'Invalid openingDate format' });
          return;
        }
      } catch (error) {
        res.status(400).json({ error: 'Invalid openingDate format' });
        return;
      }

      batch.openingDate = openDate;
      batch.isOpened = true;

      // Use provided expirationAfterOpening if available
      if (expirationAfterOpening) {
        try {
          const expDate = new Date(expirationAfterOpening);
          if (isNaN(expDate.getTime())) {
            res.status(400).json({ error: 'Invalid expirationAfterOpening format' });
            return;
          }
          batch.expirationAfterOpening = expDate;
        } catch (error) {
          res.status(400).json({ error: 'Invalid expirationAfterOpening format' });
          return;
        }
      } else {
        // Calculate from product shelf life if not provided
        const product = await Product.findById(batch.productId);
        if (!product) {
          res.status(404).json({ error: 'Product not found' });
          return;
        }

        if (product.shelfLifeAfterOpening) {
          const newExpirationDate = new Date(openDate);
          newExpirationDate.setDate(newExpirationDate.getDate() + product.shelfLifeAfterOpening);
          batch.expirationAfterOpening = newExpirationDate;
        }
      }

      await batch.save();
      await batch.populate('supplierId', 'name');

      Logger.info(`Batch opened: ${batch.batchNumber}`);
      res.status(200).json(batch);
    } catch (error) {
      Logger.error('Error opening batch:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // DELETE batch
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const batch = await Batch.findByIdAndDelete(id);
      if (!batch) {
        res.status(404).json({ error: 'Batch not found' });
        return;
      }

      Logger.info(`Batch deleted: ${batch.batchNumber}`);
      res.status(200).json({ message: 'Batch deleted successfully' });
    } catch (error) {
      Logger.error('Error deleting batch:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // GET expiring soon batches
  static async getExpiringSoon(req: Request, res: Response): Promise<void> {
    try {
      const { days = 7 } = req.query;
      const daysThreshold = parseInt(days as string, 10) || 7;

      // Calculate date threshold
      const today = new Date();
      const thresholdDate = new Date(today);
      thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

      const batches = await Batch.find({
        isOpened: false,
        expirationDate: {
          $gte: today,
          $lte: thresholdDate,
        },
      })
        .populate('productId', 'name unit')
        .populate('supplierId', 'name')
        .sort({ expirationDate: 1 });

      res.status(200).json(batches);
    } catch (error) {
      Logger.error('Error fetching expiring batches:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // GET expired batches
  static async getExpired(req: Request, res: Response): Promise<void> {
    try {
      const today = new Date();

      const batches = await Batch.find({
        expirationDate: { $lt: today },
      })
        .populate('productId', 'name unit')
        .populate('supplierId', 'name')
        .sort({ expirationDate: 1 });

      res.status(200).json(batches);
    } catch (error) {
      Logger.error('Error fetching expired batches:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
