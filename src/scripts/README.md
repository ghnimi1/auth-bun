# 🌱 Scripts de Seed de Base de Données

Ce dossier contient des scripts pour initialiser et remplir la base de données avec des données de test.

## 📋 Aperçu

- `seedCategories.ts` - Crée 10 catégories de produits
- `seedProducts.ts` - Crée 20 produits de test

## 🚀 Instructions d'Utilisation

### Prérequis

- MongoDB doit être en cours d'exécution
- Les dépendances du projet doivent être installées (`bun install`)
- Le serveur ne doit pas être en cours d'exécution

### Étape 1: Seed des Catégories

```bash
# Depuis le dossier /back
cd back
bun run src/scripts/seedCategories.ts
```

**Output attendu:**
```
✅ Successfully seeded 10 categories

📊 Categories created:
  - Fruits (fruits)
  - Légumes (legumes)
  - Produits Laitiers (produits-laitiers)
  - Viandes (viandes)
  - Poissons & Fruits de Mer (poissons-fruits-de-mer)
  - Boulangerie (boulangerie)
  - Boissons (boissons)
  - Surgelés (surgeles)
  - Conserves (conserves)
  - Épicerie (epicerie)
```

### Étape 2: Seed des Produits

```bash
bun run src/scripts/seedProducts.ts
```

**Output attendu:**
```
✅ Successfully seeded 20 products

📊 Products created:
  - Pommes Gala (150 kg)
  - Bananes (200 kg)
  - Oranges (120 kg)
  - Tomates (85 kg)
  - Carottes (180 kg)
  - ... et 15 autres produits
```

## ✅ Vérification

Après avoir exécuté les scripts, vérifiez que les données ont été créées:

```bash
# Optionnel: Vérifier via MongoDB compass ou mongosh
mongosh
> use nom_de_votre_bd
> db.categories.find().count()  // Devrait retourner 10
> db.products.find().count()    // Devrait retourner 20
```

## 📊 Données Seeded

### Catégories (10 au total)
1. **Fruits** - Pommes, Bananes, Oranges
2. **Légumes** - Tomates, Carottes, Laitue
3. **Produits Laitiers** - Lait, Yaourt, Fromage
4. **Viandes** - Steak Haché, Poulet
5. **Poissons & Fruits de Mer** - Saumon, Moules
6. **Boulangerie** - Pain, Croissants
7. **Boissons** - Jus, Eau
8. **Surgelés** - Pois surgelés
9. **Conserves** - Haricots
10. **Épicerie** - Riz, Huile d'olive

### Produits (20 au total)
Chaque produit inclut:
- ✅ Nom
- ✅ Catégorie
- ✅ Quantité
- ✅ Unité (kg, g, L, ml, pieces, sachets, boites)
- ✅ Quantité minimale
- ✅ Prix unitaire
- ✅ Fournisseur
- ✅ Date d'expiration
- ✅ Description

## ⚠️ Points Importants

### Avant de Rerunner les Scripts

**Les scripts se terminent automatiquement si des données existent déjà**. Si vous voulez recharger:

```bash
# Option 1: Supprimez les collections
mongosh
> use nom_de_votre_bd
> db.categories.deleteMany({})
> db.products.deleteMany({})
> exit

# Puis rerun les scripts
bun run src/scripts/seedCategories.ts
bun run src/scripts/seedProducts.ts
```

### Ordre d'Exécution
⚠️ **IMPORTANT**: Exécutez `seedCategories.ts` AVANT `seedProducts.ts`

Le script des produits utilise les IDs des catégories créées par le premier script.

### Idempotence
✅ Les scripts sont idempotents - vous pouvez les exécuter plusieurs fois sans problème (ils vérifieront si les données existent déjà)

## 🔧 Configuration

Les scripts utilisent les variables d'environnement de `back/.env`:

```env
MONGODB_URI=mongodb://localhost:27017/nom_de_votre_bd
NODE_ENV=development
PORT=5000
```

## 📝 Notes sur les Données

### Stocks Initiaux
- Les produits sont créés avec des quantités suffisantes pour les tests
- Certains produits ont des stocks bas pour tester les alertes
  - Saumon: 25kg (min: 5kg) ✅ OK
  - Moules: 60kg (min: 15kg) ✅ OK
  - Laitue: 35 pièces (min: 20 pièces) ⚠️ Attention

### Dates d'Expiration
- Les dates d'expiration sont définies dynamiquement au moment du seed
- Les produits frais (1-7 jours)
- Les produits laitiers (10-20 jours)
- Les produits secs (365+ jours)

### Prix
Les prix sont réalistes et incluent:
- Fruits/Légumes: 0.8€ - 3€
- Produits Laitiers: 1.2€ - 3.8€
- Viandes: 8.5€ - 9.5€
- Poissons: 5€ - 15€
- Autres: 0.6€ - 8€

## 🚨 Dépannage

### Script ne trouve pas les catégories
```
❌ Error: No categories found. Please run seedCategories.ts first!
```
**Solution**: Exécutez d'abord `seedCategories.ts`

### Connexion à MongoDB refusée
```
❌ MongoDB connection error: connect ECONNREFUSED
```
**Solution**: Vérifiez que MongoDB est en cours d'exécution et que `MONGODB_URI` est correct

### Permission refusée ou violation d'unicité
```
❌ Error: E11000 duplicate key error
```
**Solution**: Les données existent déjà. Supprimez les collections ou changez le nom de la base de données

## 🎯 Prochaines Étapes

Après le seed:

1. ✅ Démarrer le serveur: `bun run src/app.ts`
2. ✅ Ouvrir le frontend: `http://localhost:3000`
3. ✅ Aller à `/admin/categories` pour voir les catégories
4. ✅ Aller à `/admin/products` pour voir les produits
5. ✅ Tester les opérations CRUD

## 📚 Fichiers Liés

- Backend: `back/src/models/category.ts`, `back/src/models/product.ts`
- Frontend: `front/components/categories-management.tsx`, `front/components/products-management.tsx`
- Services: `front/services/category.service.ts`, `front/services/product.service.ts`

---

**Dernière mise à jour**: Mars 2026
**Statut**: ✅ Prêt à l'emploi
