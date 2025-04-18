const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken, isAdmin } = require('../middlewares/auth');
const mongoose = require('mongoose');

// Cấu hình lưu trữ file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../public/uploads/products');
    // Đảm bảo thư mục tồn tại
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'product-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Chỉ chấp nhận file hình ảnh: jpg, jpeg, png, webp'));
  }
});

// ========================
//      PRODUCT CRUD API
// ========================

// GET: Lấy tất cả sản phẩm
router.get('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { search, category, sort, page = 1, limit = 10 } = req.query;
    const query = {};
    
    // Tìm kiếm theo tên sản phẩm
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    
    // Lọc theo danh mục
    if (category) {
      try {
        // Check if it's a valid ObjectId
        if (mongoose.Types.ObjectId.isValid(category)) {
          query.category = new mongoose.Types.ObjectId(category);
        } else {
          // Fallback to categoryName for backward compatibility
          query.categoryName = category;
        }
      } catch (error) {
        console.error('Invalid category format:', error);
        // If there's an error, use a default query that won't match anything
        query.category = null;
      }
    }
    
    // Sắp xếp
    let sortOption = {};
    if (sort === 'price_asc') {
      sortOption = { price: 1 };
    } else if (sort === 'price_desc') {
      sortOption = { price: -1 };
    } else if (sort === 'name_asc') {
      sortOption = { name: 1 };
    } else if (sort === 'name_desc') {
      sortOption = { name: -1 };
    } else if (sort === 'newest') {
      sortOption = { createdAt: -1 };
    } else {
      // Mặc định sắp xếp theo thời gian tạo giảm dần
      sortOption = { createdAt: -1 };
    }
    
    // Tính toán phân trang
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;
    
    // Truy vấn sản phẩm với phân trang và sắp xếp
    const products = await Product.find(query)
      .populate('category', 'name')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNumber);
    
    // Đếm tổng số sản phẩm thỏa mãn điều kiện để tính tổng số trang
    const total = await Product.countDocuments(query);
    
    // Lấy danh sách các danh mục từ sản phẩm (để hỗ trợ tương thích ngược)
    const categories = await Product.distinct('categoryName');
    
    res.json({
      success: true,
      products,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber)
      },
      categories
    });
  } catch (err) {
    console.error('Lỗi khi lấy danh sách sản phẩm:', err);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách sản phẩm',
      error: err.message
    });
  }
});

// GET: Lấy danh sách các danh mục
router.get('/categories', authenticateToken, isAdmin, async (req, res) => {
  try {
    // Replace distinct with an aggregation to get category info
    const categories = await Product.aggregate([
      { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'categoryInfo' } },
      { $unwind: { path: '$categoryInfo', preserveNullAndEmptyArrays: true } },
      { $group: { 
        _id: '$category', 
        name: { $first: '$categoryInfo.name' },
        count: { $sum: 1 }
      }},
      { $match: { _id: { $ne: null } } },
      { $sort: { count: -1 } }
    ]);
    
    // Format for client consumption
    const formattedCategories = categories.map(cat => ({
      _id: cat._id,
      name: cat.name || 'Unknown'
    }));
    
    res.json({
      success: true,
      categories: formattedCategories
    });
  } catch (err) {
    console.error('Lỗi khi lấy danh sách danh mục:', err);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách danh mục',
      error: err.message
    });
  }
});

// GET: Lấy chi tiết một sản phẩm
router.get('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name');
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }
    
    res.json({
      success: true,
      product
    });
  } catch (err) {
    console.error('Lỗi khi lấy chi tiết sản phẩm:', err);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy chi tiết sản phẩm',
      error: err.message
    });
  }
});

// POST: Tạo sản phẩm mới
router.post('/', authenticateToken, isAdmin, upload.single('image'), async (req, res) => {
  try {
    const { name, price, description, category, rating } = req.body;
    
    // Validate dữ liệu đầu vào
    if (!name || !price) {
      return res.status(400).json({
        success: false,
        message: 'Tên sản phẩm và giá là bắt buộc'
      });
    }
    
    // Tạo sản phẩm mới
    const newProduct = new Product({
      name,
      price: parseFloat(price),
      description,
      category,
      rating: parseFloat(rating) || 0
    });
    
    // Nếu có file upload
    if (req.file) {
      newProduct.image = `/uploads/products/${req.file.filename}`;
    }
    
    // Lưu sản phẩm vào database
    await newProduct.save();
    
    res.status(201).json({
      success: true,
      message: 'Thêm sản phẩm thành công',
      product: newProduct
    });
  } catch (err) {
    console.error('Lỗi khi thêm sản phẩm:', err);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi thêm sản phẩm',
      error: err.message
    });
  }
});

// PUT: Cập nhật sản phẩm
router.put('/:id', authenticateToken, isAdmin, upload.single('image'), async (req, res) => {
  try {
    const { name, price, description, category, rating } = req.body;
    const productId = req.params.id;
    
    // Tìm sản phẩm cần cập nhật
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }
    
    // Cập nhật thông tin sản phẩm
    const updatedData = {
      name: name || product.name,
      price: parseFloat(price) || product.price,
      description: description || product.description,
      category: category || product.category,
      rating: parseFloat(rating) || product.rating
    };
    
    // Nếu có file upload mới
    if (req.file) {
      // Xóa ảnh cũ nếu có
      if (product.image && product.image.startsWith('/uploads/')) {
        const oldImagePath = path.join(__dirname, '../public', product.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      
      updatedData.image = `/uploads/products/${req.file.filename}`;
    }
    
    // Cập nhật sản phẩm
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      updatedData,
      { new: true }
    );
    
    res.json({
      success: true,
      message: 'Cập nhật sản phẩm thành công',
      product: updatedProduct
    });
  } catch (err) {
    console.error('Lỗi khi cập nhật sản phẩm:', err);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật sản phẩm',
      error: err.message
    });
  }
});

// DELETE: Xóa sản phẩm
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const productId = req.params.id;
    
    // Tìm sản phẩm cần xóa
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }
    
    // Xóa ảnh sản phẩm nếu có
    if (product.image && product.image.startsWith('/uploads/')) {
      const imagePath = path.join(__dirname, '../public', product.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    // Xóa sản phẩm
    await Product.findByIdAndDelete(productId);
    
    res.json({
      success: true,
      message: 'Xóa sản phẩm thành công'
    });
  } catch (err) {
    console.error('Lỗi khi xóa sản phẩm:', err);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa sản phẩm',
      error: err.message
    });
  }
});

module.exports = router;
