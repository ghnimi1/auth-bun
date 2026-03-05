import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  category: mongoose.Types.ObjectId; // Référence à Category
  quantity: number;
  unit: 'kg' | 'g' | 'L' | 'ml' | 'pieces' | 'sachets' | 'boites';
  minQuantity: number;
  unitPrice: number;
  shelfLifeAfterOpening?: number; // Jours
  supplier?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [100, 'Product name must be less than 100 characters'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    quantity: {
      type: Number,
      default: 0,
      min: [0, 'Quantity cannot be negative'],
    },
    unit: {
      type: String,
      enum: {
        values: ['kg', 'g', 'L', 'ml', 'pieces', 'sachets', 'boites'],
        message: 'Invalid unit type',
      },
      required: [true, 'Unit is required'],
    },
    minQuantity: {
      type: Number,
      required: [true, 'Minimum quantity is required'],
      min: [0, 'Minimum quantity cannot be negative'],
    },
    unitPrice: {
      type: Number,
      required: [true, 'Unit price is required'],
      min: [0, 'Unit price cannot be negative'],
    },
    shelfLifeAfterOpening: {
      type: Number,
      min: [1, 'Shelf life must be at least 1 day'],
    },
    supplier: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: 'products',
  }
);

// Index pour les recherches courantes
ProductSchema.index({ name: 'text' });
ProductSchema.index({ category: 1 });
ProductSchema.index({ isActive: 1 });
ProductSchema.index({ category: 1, isActive: 1 });

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
