import { connectDB } from '../config/database'
import { Product } from '../models/product'
import { Category } from '../models/category'
import { Logger } from '../utils/logger'

/**
 * Script de migration pour lier les produits existants aux catégories
 * Exécuter avec: npm run migrate:products-to-categories
 */

async function migrateProductsToCategories() {
  try {
    await connectDB()
    Logger.info('Migration: Liaising products to categories...')

    // Récupérer tous les produits et catégories
    const products = await Product.find().lean()
    const categories = await Category.find().lean()

    if (products.length === 0) {
      Logger.info('No products to migrate')
      return
    }

    Logger.info(`Found ${products.length} products and ${categories.length} categories`)

    let updated = 0
    let failed = 0
    const failedProducts = []

    for (const product of products) {
      try {
        // Si la catégorie est déjà un ObjectId, passer
        if (typeof product.category === 'object' && product.category._id) {
          continue
        }

        // Chercher la catégorie par slug ou name
        const categorySlug = product.category as any
        const category = categories.find(
          (c) => c.slug === categorySlug || c.name.toLowerCase() === categorySlug.toLowerCase()
        )

        if (!category) {
          Logger.warn(`Category not found for product: ${product.name} (category: ${categorySlug})`)
          failedProducts.push({
            productId: product._id,
            name: product.name,
            category: categorySlug,
            reason: 'Category not found',
          })
          failed++
          continue
        }

        // Mettre à jour le produit
        await Product.updateOne({ _id: product._id }, { category: category._id })

        updated++
        Logger.info(`Migrated: ${product.name} -> ${category.name}`)
      } catch (error: any) {
        Logger.error(`Error migrating product ${product._id}:`, error)
        failedProducts.push({
          productId: product._id,
          name: product.name,
          reason: error.message,
        })
        failed++
      }
    }

    Logger.info(`\n=== Migration Complete ===`)
    Logger.info(`Updated: ${updated} products`)
    Logger.info(`Failed: ${failed} products`)

    if (failedProducts.length > 0) {
      Logger.warn('\nFailed migrations:')
      failedProducts.forEach((fp) => {
        Logger.warn(`  - ${fp.name} (${fp.reason})`)
      })
    }

    process.exit(0)
  } catch (error) {
    Logger.error('Migration failed:', error)
    process.exit(1)
  }
}

// Exécuter la migration
migrateProductsToCategories()
