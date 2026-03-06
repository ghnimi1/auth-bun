import mongoose, { Schema, Document } from 'mongoose';

export interface IBatch extends Document {
  productId: mongoose.Types.ObjectId; // Reference to Product
  supplierId?: mongoose.Types.ObjectId; // Optional reference to Supplier
  batchNumber: string;
  quantity: number;
  receptionDate: Date; // Date de réception (FIFO)
  productionDate?: Date; // Date de fabrication
  expirationDate: Date; // DLC du fabricant (produit fermé)
  openingDate?: Date; // Date d'ouverture du produit
  expirationAfterOpening?: Date; // Nouvelle DLC après ouverture
  isOpened: boolean; // État du lot (fermé/ouvert)
  notes?: string; // Notes spécifiques au lot
  createdAt: Date;
  updatedAt: Date;
}

const BatchSchema = new Schema<IBatch>(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required'],
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
    },
    batchNumber: {
      type: String,
      required: [true, 'Batch number is required'],
      trim: true,
      maxlength: [50, 'Batch number must be less than 50 characters'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
    },
    receptionDate: {
      type: Date,
      required: [true, 'Reception date is required'],
    },
    productionDate: {
      type: Date,
    },
    expirationDate: {
      type: Date,
      required: [true, 'Expiration date is required'],
    },
    openingDate: {
      type: Date,
    },
    expirationAfterOpening: {
      type: Date,
    },
    isOpened: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes must be less than 500 characters'],
    },
  },
  {
    timestamps: true,
    collection: 'batches',
  }
);

// Index pour les recherches courantes
BatchSchema.index({ productId: 1 });
BatchSchema.index({ batchNumber: 1 });
BatchSchema.index({ expirationDate: 1 });
BatchSchema.index({ isOpened: 1 });
BatchSchema.index({ productId: 1, isOpened: 1 });
BatchSchema.index({ productId: 1, expirationDate: 1 });

export const Batch = mongoose.model<IBatch>('Batch', BatchSchema);
