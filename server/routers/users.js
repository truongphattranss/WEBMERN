const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Middleware xác thực JWT
const authenticateToken = (req, res, next) => {
  try {
    console.log('authenticateToken middleware triggered');
    const authHeader = req.headers['authorization'];
    console.log('Auth Header:', authHeader ? 'Present' : 'Missing');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      console.log('Token not found in request');
      return res.status(401).json({ message: 'Không tìm thấy token xác thực' });
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET environment variable not configured');
      throw new Error('JWT_SECRET không được cấu hình');
    }

    console.log('Verifying token...');
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        console.error('Token verification error:', err.name, err.message);
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ message: 'Token đã hết hạn' });
        }
        return res.status(403).json({ message: 'Token không hợp lệ' });
      }
      console.log('Token verified successfully, user:', user.username);
      req.user = user;
      next();
    });
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Lỗi xác thực người dùng' });
  }
};

// Đăng ký tài khoản
router.post('/register', async (req, res) => {
  const { username, password, confirmPassword } = req.body;

  try {
    // Validate đầu vào
    if (!username?.trim() || !password?.trim() || !confirmPassword?.trim()) {
      return res.status(400).json({ 
        message: 'Vui lòng điền đầy đủ thông tin' 
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ 
        message: 'Mật khẩu nhập lại không khớp' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'Mật khẩu phải có ít nhất 6 ký tự'
      });
    }

    // Kiểm tra username đã tồn tại
    const existingUser = await User.findOne({ username: username.trim() });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'Tên đăng nhập đã tồn tại' 
      });
    }

    // Tạo user mới
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username: username.trim(),
      password: hashedPassword,
      role: 'user'
    });

    await newUser.save();

    // Tạo token cho user mới
    const token = jwt.sign(
      { id: newUser._id, username: newUser.username, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Đăng ký tài khoản thành công! Chào mừng bạn đến với hệ thống.',
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('Lỗi đăng ký:', error);
    res.status(500).json({ 
      message: 'Lỗi server khi đăng ký tài khoản' 
    });
  }
});

// Đăng nhập
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Validate đầu vào
    if (!username?.trim() || !password?.trim()) {
      return res.status(400).json({ 
        message: 'Vui lòng điền đầy đủ thông tin' 
      });
    }

    // Tìm user
    const user = await User.findOne({ username: username.trim() });
    if (!user) {
      return res.status(401).json({ 
        message: 'Tên đăng nhập hoặc mật khẩu không đúng' 
      });
    }

    // Kiểm tra password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        message: 'Tên đăng nhập hoặc mật khẩu không đúng' 
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET không được cấu hình');
    }

    // Tạo JWT token
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Lưu thông tin user vào session
    req.session.user = {
      id: user._id,
      username: user.username,
      role: user.role
    };

    res.json({
      message: 'Đăng nhập thành công! Chào mừng bạn trở lại.',
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    res.status(500).json({ 
      message: error.message || 'Lỗi server khi đăng nhập' 
    });
  }
});

// Đăng xuất
router.post('/logout', authenticateToken, (req, res) => {
  try {
    // Xóa session
    req.session.destroy((err) => {
      if (err) {
        console.error('Lỗi khi xóa session:', err);
        return res.status(500).json({ 
          message: 'Lỗi server khi đăng xuất' 
        });
      }
      
      res.json({ 
        success: true,
        message: 'Đăng xuất thành công' 
      });
    });
  } catch (error) {
    console.error('Lỗi đăng xuất:', error);
    res.status(500).json({ 
      message: 'Lỗi server khi đăng xuất' 
    });
  }
});

// Lấy thông tin user hiện tại
router.get('/profile', authenticateToken, (req, res) => {
  try {
    console.log('Profile endpoint accessed');
    // Lấy thông tin user từ token đã được xác thực
    const { id, username, role } = req.user;
    console.log('Returning profile for user:', username);

    res.json({
      success: true,
      user: {
        id,
        username,
        role
      }
    });
  } catch (error) {
    console.error('Lỗi lấy thông tin profile:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin profile'
    });
  }
});

// Đổi mật khẩu
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Validate đầu vào
    if (!currentPassword?.trim() || !newPassword?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
      });
    }

    // Tìm user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Kiểm tra mật khẩu hiện tại
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Mật khẩu hiện tại không đúng'
      });
    }

    // Hash mật khẩu mới
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Cập nhật mật khẩu
    user.password = hashedPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Đổi mật khẩu thành công'
    });
  } catch (error) {
    console.error('Lỗi đổi mật khẩu:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đổi mật khẩu'
    });
  }
});

module.exports = router;