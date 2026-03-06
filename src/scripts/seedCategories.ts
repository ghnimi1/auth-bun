import mongoose from 'mongoose'
import { Category } from '../models/category'
import { connectDB } from '../config/database'
import { Logger } from '../utils/logger'

const seedCategories = async () => {
  try {
    await connectDB()
    
    const existingCount = await Category.countDocuments()
    if (existingCount > 0) {
      Logger.info(`Database already contains ${existingCount} categories`)
      process.exit(0)
    }

    const categories = [
      {
        name: 'Fruits',
        slug: 'fruits',
        description: 'Fruits frais et biologiques',
        icon: '🍎',
        color: '#FF6B6B',
        displayOrder: 1,
        isActive: true,
      },
      {
        name: 'Légumes',
        slug: 'legumes',
        description: 'Légumes de saison',
        icon: '🥕',
        color: '#FFA500',
        displayOrder: 2,
        isActive: true,
      },
      {
        name: 'Produits Laitiers',
        slug: 'produits-laitiers',
        description: 'Lait, fromage, yaourt',
        icon: '🥛',
        color: '#E8E8E8',
        displayOrder: 3,
        isActive: true,
      },
      {
        name: 'Viandes',
        slug: 'viandes',
        description: 'Viandes fraîches',
        icon: '🥩',
        color: '#C41E3A',
        displayOrder: 4,
        isActive: true,
      },
      {
        name: 'Poissons',
        slug: 'poissons',
        description: 'Poissons et fruits de mer',
        icon: '🐟',
        color: '#4A90E2',
        displayOrder: 5,
        isActive: true,
      },
      {
        name: 'Boulangerie',
        slug: 'boulangerie',
        description: 'Pain et pâtisseries',
        icon: '🍞',
        color: '#D4A574',
        displayOrder: 6,
        isActive: true,
      },
      {
        name: 'Boissons',
        slug: 'boissons',
        description: 'Jus, sodas, eau',
        icon: '🥤',
        color: '#6C7FBF',
        displayOrder: 7,
        isActive: true,
      },
      {
        name: 'Surgelés',
        slug: 'surgeles',
        description: 'Produits surgelés',
        icon: '❄️',
        color: '#5DADE2',
        displayOrder: 8,
        isActive: true,
      },
      {
        name: 'Conserves',
        slug: 'conserves',
        description: 'Conserves et boîtes',
        icon: '📦',
        color: '#8B4513',
        displayOrder: 9,
        isActive: true,
      },
      {
        name: 'Épicerie',
        slug: 'epicerie',
        description: 'Épicerie générale',
        icon: '🛒',
        color: '#F4A460',
        displayOrder: 10,
        isActive: true,
      },
    ]

    const inserted = await Category.insertMany(categories)
    Logger.info(`✅ Successfully seeded ${inserted.length} categories`)
    
    console.log('\n📊 Categories created:')
    inserted.forEach((cat) => {
      console.log(`  - ${cat.name} (${cat.slug})`)
    })

    process.exit(0)
  } catch (error) {
    Logger.error('Failed to seed categories', error)
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

seedCategories()
