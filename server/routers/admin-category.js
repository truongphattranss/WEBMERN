const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Product = require('../models/Product');
const { authenticateToken, isAdmin } = require('../middlewares/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const slugify = require('slugify');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../public/uploads/categories');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'category-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
}).single('image');

// Helper function to create a slug
const createSlug = (name) => {
  const slug = slugify(name, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g
  });
  return slug;
};

// GET: Get all categories
router.get('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const categories = await Category.find()
      .sort({ name: 1 });

    res.json({
      success: true,
      categories: categories,
      flatCategories: categories
    });
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({
      success: false,
      message: 'Server error when fetching categories',
      error: err.message
    });
  }
});

// GET: Get a single category by ID
router.get('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    res.json({
      success: true,
      category
    });
  } catch (err) {
    console.error('Error fetching category:', err);
    res.status(500).json({
      success: false,
      message: 'Server error when fetching category',
      error: err.message
    });
  }
});

// POST: Create a new category
router.post('/', authenticateToken, isAdmin, (req, res) => {
  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    
    try {
      const { name, description } = req.body;
      
      // Validate required fields
      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Category name is required'
        });
      }
      
      // Check if category name already exists
      const existingCategory = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'A category with this name already exists'
        });
      }
      
      // Create slug
      const slug = createSlug(name);
      
      // Prepare image path if an image was uploaded
      let imagePath = '';
      if (req.file) {
        // The path should be relative to the public directory
        imagePath = `/uploads/categories/${req.file.filename}`;
      }
      
      // Create category
      const newCategory = new Category({
        name,
        slug,
        description: description || '',
        image: imagePath
      });
      
      await newCategory.save();
      
      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        category: newCategory
      });
    } catch (err) {
      console.error('Error creating category:', err);
      res.status(500).json({
        success: false,
        message: 'Server error when creating category',
        error: err.message
      });
    }
  });
});

// PUT: Update a category
router.put('/:id', authenticateToken, isAdmin, (req, res) => {
  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    
    try {
      const categoryId = req.params.id;
      const { name, description, isActive } = req.body;
      
      // Find the category to update
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }
      
      // Check if new name conflicts with existing categories
      if (name && name !== category.name) {
        const existingCategory = await Category.findOne({ 
          name: { $regex: new RegExp(`^${name}$`, 'i') },
          _id: { $ne: categoryId }
        });
        
        if (existingCategory) {
          return res.status(400).json({
            success: false,
            message: 'A category with this name already exists'
          });
        }
        
        // Update slug if name changes
        category.name = name;
        category.slug = createSlug(name);
      }
      
      // Update other fields
      if (description !== undefined) {
        category.description = description;
      }
      
      if (isActive !== undefined) {
        category.isActive = isActive === 'true' || isActive === true;
      }
      
      // Handle image upload if a new image was provided
      if (req.file) {
        // Delete old image if it exists
        if (category.image && category.image.startsWith('/uploads/')) {
          const oldImagePath = path.join(__dirname, '../public', category.image);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
        
        // Set new image path
        category.image = `/uploads/categories/${req.file.filename}`;
      }
      
      // Save updated category
      await category.save();
      
      res.json({
        success: true,
        message: 'Category updated successfully',
        category
      });
    } catch (err) {
      console.error('Error updating category:', err);
      res.status(500).json({
        success: false,
        message: 'Server error when updating category',
        error: err.message
      });
    }
  });
});

// DELETE: Delete a category
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const categoryId = req.params.id;
    
    // Check if this category is used by any products
    const productsCount = await Product.countDocuments({ category: categoryId });
    if (productsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category that is used by ${productsCount} products. Please reassign products first.`
      });
    }
    
    // Find the category to delete
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Delete image if it exists
    if (category.image && category.image.startsWith('/uploads/')) {
      const imagePath = path.join(__dirname, '../public', category.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    // Delete the category
    await Category.findByIdAndDelete(categoryId);
    
    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting category:', err);
    res.status(500).json({
      success: false,
      message: 'Server error when deleting category',
      error: err.message
    });
  }
});

module.exports = router; 