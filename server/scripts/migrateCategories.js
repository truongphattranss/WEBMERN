/**
 * Migration script to transfer existing product categories to the new Category model
 * Run with: node scripts/migrateCategories.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const slugify = require('slugify');
const Product = require('../models/Product');
const Category = require('../models/Category');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shop', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB Connected Successfully'))
.catch(err => {
  console.error('❌ MongoDB Connection Error:', err);
  process.exit(1);
});

// Helper function to create a slug
const createSlug = (name) => {
  const slug = slugify(name, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g
  });
  return slug;
};

const migrateCategories = async () => {
  try {
    console.log('Starting category migration...');
    
    // Get all distinct categories from products (as strings)
    const distinctCategories = await Product.distinct('category');
    console.log(`Found ${distinctCategories.length} distinct categories`, distinctCategories);
    
    // Create categories in the new model
    const categoryMap = {};
    
    for (const categoryName of distinctCategories) {
      // Skip empty categories
      if (!categoryName || categoryName.trim() === '') continue;
      
      // Create a slug for the category
      const slug = createSlug(categoryName);
      
      // Check if category already exists in the new model
      let category = await Category.findOne({ 
        name: { $regex: new RegExp(`^${categoryName}$`, 'i') }
      });
      
      if (!category) {
        // Create new category
        category = new Category({
          name: categoryName,
          slug,
          description: `Category for ${categoryName} products`,
          isActive: true
        });
        
        await category.save();
        console.log(`Created new category: ${categoryName}`);
      } else {
        console.log(`Category already exists: ${categoryName}`);
      }
      
      // Store the mapping from old category name to new category ID
      categoryMap[categoryName] = category._id;
    }
    
    // Update all products to use the new category IDs
    console.log('Updating products with new category references...');
    
    // Use Product.find() without query to get all products
    const products = await Product.find();
    console.log(`Found ${products.length} products to update`);
    
    // Create a map of known product names to categories
    const productNameToCategoryMap = {
      'ChatGPT Plus': 'AI Chatbot',
      'Discord Nitro': 'Communication'
      // Add more mappings as needed
    };
    
    // Debug: print product data
    products.forEach(product => {
      console.log(`Product ID: ${product._id}, Name: ${product.name}, Category: ${product.category}, Type: ${typeof product.category}`);
    });
    
    let updatedCount = 0;
    
    for (const product of products) {
      let categoryName = product.category;
      
      // Skip if category is already an ObjectId (already migrated)
      if (mongoose.Types.ObjectId.isValid(product.category)) {
        console.log(`Product ${product._id} already has an ObjectId category: ${product.category}`);
        continue;
      }
      
      // If category is undefined, try to assign one based on product name
      if (!categoryName && product.name && productNameToCategoryMap[product.name]) {
        categoryName = productNameToCategoryMap[product.name];
        console.log(`Assigning category "${categoryName}" to product "${product.name}" based on name mapping`);
      }
      
      if (categoryName && categoryMap[categoryName]) {
        // Store the old category name for backward compatibility
        product.categoryName = categoryName;
        
        // Set the new category reference
        product.category = categoryMap[categoryName];
        
        await product.save();
        updatedCount++;
        console.log(`Updated product: ${product.name} with category: ${categoryName} -> ${categoryMap[categoryName]}`);
      } else {
        console.log(`No category mapping found for product ${product._id} with category ${categoryName || 'undefined'}`);
      }
    }
    
    console.log(`Updated ${updatedCount} products with new category references`);
    console.log('Migration completed successfully');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Close the database connection
    mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the migration
migrateCategories(); 