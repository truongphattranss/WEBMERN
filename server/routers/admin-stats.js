const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const jwt = require('jsonwebtoken');

// Middleware xác thực JWT
const authenticateToken = (req, res, next) => {
  try {
    // Kiểm tra token từ cookie
    let token = null;
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    
    // Kiểm tra header Authorization nếu không có token trong cookie
    if (!token) {
      const authHeader = req.headers['authorization'];
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
          success: false, 
          message: 'Không tìm thấy token xác thực' 
        });
      }
      token = authHeader.split(' ')[1];
    }

    // Xác thực token
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET không được cấu hình');
      return res.status(500).json({ 
        success: false, 
        message: 'Lỗi cấu hình server' 
      });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        console.error('Token verification error:', err);
        return res.status(403).json({ 
          success: false, 
          message: 'Token không hợp lệ hoặc đã hết hạn' 
        });
      }
      
      req.user = user;
      next();
    });
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi xác thực người dùng' 
    });
  }
};

// Middleware kiểm tra quyền admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ 
    success: false, 
    message: 'Không có quyền truy cập' 
  });
};

// API endpoint lấy thống kê
router.get('/stats', authenticateToken, isAdmin, async (req, res) => {
  try {
    // Lấy số lượng người dùng
    const totalUsers = await User.countDocuments();
    
    // Lấy số lượng sản phẩm
    const totalProducts = await Product.countDocuments();
    
    // Lấy số lượng đơn hàng
    const totalOrders = await Order.countDocuments();
    
    // Lấy 5 đơn hàng gần nhất để hiển thị trên dashboard
    const recentOrders = await Order.find()
      .populate('user', 'username')
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Lấy tất cả đơn hàng để phục vụ thống kê và biểu đồ
    const allOrders = await Order.find()
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      totalUsers,
      totalProducts,
      totalOrders,
      recentOrders,
      allOrders
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi lấy thống kê admin' 
    });
  }
});

module.exports = router; 