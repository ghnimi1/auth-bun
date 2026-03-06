import mongoose, { Schema, Document } from 'mongoose'
import { Logger } from '../utils/logger'

export interface ICategory extends Document {
  name: string
  slug: string
  description?: string
  icon?: string
  color?: string
  displayOrder: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const CategorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, 'Le nom de la catégorie est obligatoire'],
      trim: true,
      maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères'],
      minlength: [2, 'Le nom doit contenir au moins 2 caractères'],
    },
    slug: {
      type: String,
      required: [true, 'Le slug est obligatoire'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Le slug doit contenir uniquement des lettres minuscules, chiffres et tirets'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'La description ne peut pas dépasser 500 caractères'],
    },
    icon: {
      type: String,
      trim: true,
      maxlength: [50, 'L\'icône ne peut pas dépasser 50 caractères'],
    },
    color: {
      type: String,
      trim: true,
      match: [/^#[0-9A-Fa-f]{6}$/, 'La couleur doit être au format hexadécimal (#RRGGBB)'],
    },
    displayOrder: {
      type: Number,
      default: 0,
      min: [0, 'L\'ordre d\'affichage doit être positif'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
)

// Index pour la recherche
CategorySchema.index({ name: 'text', slug: 'text', description: 'text' })
/* CategorySchema.index({ slug: 1 }) */
CategorySchema.index({ isActive: 1 })
CategorySchema.index({ displayOrder: 1 })

// Middleware pre-save pour créer le slug depuis le name si nécessaire
CategorySchema.pre('save', function (next: any) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '')
  }
  
})

export const Category = mongoose.model<ICategory>('Category', CategorySchema)
