const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to verify JWT token and authenticate users
 * Extracts token from Authorization header or cookies
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from authorization header or cookie
    let token = null;
    
    // Check Authorization header (Bearer token)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    
    // If token not found in header, try cookies
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // If no token found, return unauthorized
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy token xác thực, vui lòng đăng nhập'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    
    // Find user by decoded id
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Người dùng không tồn tại hoặc đã bị xóa'
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ, vui lòng đăng nhập lại'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token đã hết hạn, vui lòng đăng nhập lại'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Lỗi xác thực, vui lòng thử lại sau'
    });
  }
};

/**
 * Middleware to check if user is an admin
 * Must be used after authenticateToken middleware
 */
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Bạn chưa đăng nhập'
    });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Bạn không có quyền truy cập tính năng này'
    });
  }
  
  next();
};

/**
 * Optional authentication middleware that doesn't require authentication
 * but will attach user to request if token is valid
 */
const optionalAuth = async (req, res, next) => {
  try {
    // Get token from authorization header or cookie
    let token = null;
    
    // Check Authorization header (Bearer token)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    
    // If token not found in header, try cookies
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // If no token found, continue without user
    if (!token) {
      return next();
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    
    // Find user by decoded id
    const user = await User.findById(decoded.id).select('-password');
    
    if (user) {
      // Attach user to request object
      req.user = user;
    }
    
    next();
  } catch (error) {
    // Continue without user on any error
    next();
  }
};

module.exports = {
  authenticateToken,
  isAdmin,
  optionalAuth
}; 