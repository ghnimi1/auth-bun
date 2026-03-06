import mongoose from 'mongoose'
import { Product } from '../models/product'
import { Category } from '../models/category'
import { connectDB } from '../config/database'
import { Logger } from '../utils/logger'

const seedProducts = async () => {
  try {
    await connectDB()

    const existingCount = await Product.countDocuments()
    if (existingCount > 0) {
      Logger.info(`Database already contains ${existingCount} products`)
      process.exit(0)
    }

    const categories = await Category.find()
    if (categories.length === 0) {
      Logger.error('No categories found. Please run seedCategories.ts first!')
      process.exit(1)
    }

    const categoryMap: { [key: string]: string } = {}
    categories.forEach((cat) => {
      categoryMap[cat.slug] = cat._id.toString()
    })

    const products = [
      {
        name: 'Pommes Gala',
        category: categoryMap['fruits'],
        quantity: 150,
        unit: 'kg',
        minQuantity: 20,
        price: 2.5,
        supplier: 'Ferme Bio',
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        name: 'Bananes',
        category: categoryMap['fruits'],
        quantity: 200,
        unit: 'kg',
        minQuantity: 30,
        price: 1.8,
        supplier: 'Import Tropical',
        expirationDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
      {
        name: 'Oranges',
        category: categoryMap['fruits'],
        quantity: 120,
        unit: 'kg',
        minQuantity: 15,
        price: 3.0,
        supplier: 'Agrumes',
        expirationDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
      },
      {
        name: 'Tomates',
        category: categoryMap['legumes'],
        quantity: 85,
        unit: 'kg',
        minQuantity: 25,
        price: 2.0,
        supplier: 'Ferme Bio',
        expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      {
        name: 'Carottes',
        category: categoryMap['legumes'],
        quantity: 180,
        unit: 'kg',
        minQuantity: 40,
        price: 0.8,
        supplier: 'Bio Légumes',
        expirationDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      },
      {
        name: 'Laitue Romaine',
        category: categoryMap['legumes'],
        quantity: 35,
        unit: 'pieces',
        minQuantity: 20,
        price: 1.5,
        supplier: 'Ferme Locale',
        expirationDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      },
      {
        name: 'Lait Entier 1L',
        category: categoryMap['produits-laitiers'],
        quantity: 250,
        unit: 'pieces',
        minQuantity: 50,
        price: 1.2,
        supplier: 'Laiterie',
        expirationDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      },
      {
        name: 'Yaourt Nature 500g',
        category: categoryMap['produits-laitiers'],
        quantity: 120,
        unit: 'pieces',
        minQuantity: 30,
        price: 2.5,
        supplier: 'Laiterie',
        expirationDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      },
      {
        name: 'Fromage Camembert',
        category: categoryMap['produits-laitiers'],
        quantity: 45,
        unit: 'pieces',
        minQuantity: 15,
        price: 3.8,
        supplier: 'Fromagerie',
        expirationDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      },
      {
        name: 'Steak Haché 5kg',
        category: categoryMap['viandes'],
        quantity: 50,
        unit: 'kg',
        minQuantity: 10,
        price: 8.5,
        supplier: 'Boucherie',
        expirationDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
      {
        name: 'Poulet Fermier',
        category: categoryMap['viandes'],
        quantity: 35,
        unit: 'kg',
        minQuantity: 8,
        price: 9.5,
        supplier: 'Élevage Bio',
        expirationDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      },
      {
        name: 'Saumon Atlantique',
        category: categoryMap['poissons'],
        quantity: 25,
        unit: 'kg',
        minQuantity: 5,
        price: 15.0,
        supplier: 'Marée',
        expirationDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      },
      {
        name: 'Moules',
        category: categoryMap['poissons'],
        quantity: 60,
        unit: 'kg',
        minQuantity: 15,
        price: 5.0,
        supplier: 'Marée',
        expirationDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      },
      {
        name: 'Pain Blanc 500g',
        category: categoryMap['boulangerie'],
        quantity: 150,
        unit: 'pieces',
        minQuantity: 40,
        price: 1.2,
        supplier: 'Boulangerie',
        expirationDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      },
      {
        name: 'Croissants',
        category: categoryMap['boulangerie'],
        quantity: 200,
        unit: 'pieces',
        minQuantity: 50,
        price: 0.9,
        supplier: 'Boulangerie',
        expirationDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      },
      {
        name: 'Jus Orange 1L',
        category: categoryMap['boissons'],
        quantity: 300,
        unit: 'pieces',
        minQuantity: 60,
        price: 2.0,
        supplier: 'Jus Nature',
        expirationDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      },
      {
        name: 'Eau Minérale 1.5L',
        category: categoryMap['boissons'],
        quantity: 500,
        unit: 'pieces',
        minQuantity: 100,
        price: 0.6,
        supplier: 'Eau Pure',
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
      {
        name: 'Pois Surgelés 1kg',
        category: categoryMap['surgeles'],
        quantity: 120,
        unit: 'pieces',
        minQuantity: 25,
        price: 2.5,
        supplier: 'Congélation',
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
      {
        name: 'Haricots Rouges 400g',
        category: categoryMap['conserves'],
        quantity: 200,
        unit: 'pieces',
        minQuantity: 40,
        price: 0.8,
        supplier: 'Conserves',
        expirationDate: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000),
      },
      {
        name: 'Riz Basmati 1kg',
        category: categoryMap['epicerie'],
        quantity: 150,
        unit: 'pieces',
        minQuantity: 30,
        price: 4.0,
        supplier: 'Import Riz',
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    ]

    const inserted = await Product.insertMany(products)
    Logger.info(`✅ Successfully seeded ${inserted.length} products`)

    console.log('\n📊 Products created:')
    inserted.forEach((prod) => {
      console.log(`  - ${prod.name} (${prod.quantity} ${prod.unit})`)
    })

    process.exit(0)
  } catch (error) {
    Logger.error('Failed to seed products', error)
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

seedProducts()
