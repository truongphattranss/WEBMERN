const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/User'); // Đường dẫn đến model User
const { authenticateToken, isAdmin } = require('../middlewares/auth');
const mongoose = require('mongoose');

/**
 * @route   GET /api/admin/users
 * @desc    Lấy danh sách người dùng với phân trang và tìm kiếm
 * @access  Admin
 */
router.get('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const role = req.query.role || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    // Xây dựng query dựa trên tham số
    const query = {};
    
    // Tìm kiếm theo username
    if (search) {
      // Sanitize search string by escaping regex special characters
      const sanitizedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Search by username only
      query.username = { $regex: sanitizedSearch, $options: 'i' };
    }
    
    // Lọc theo vai trò
    if (role) {
      query.role = role;
    }

    // Đếm tổng số người dùng thỏa mãn điều kiện
    const total = await User.countDocuments(query);

    // Lấy danh sách người dùng theo phân trang và sắp xếp
    const sort = {};
    sort[sortBy] = sortOrder;

    const users = await User.find(query)
      .select('-password')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách người dùng'
    });
  }
});

/**
 * @route   GET /api/admin/users/:id
 * @desc    Lấy thông tin chi tiết 1 người dùng
 * @access  Admin
 */
router.get('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID người dùng không hợp lệ'
      });
    }

    const user = await User.findById(id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thông tin người dùng'
    });
  }
});

/**
 * @route   POST /api/admin/users
 * @desc    Tạo người dùng mới
 * @access  Admin
 */
router.post('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { username, password, role } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin username và password'
      });
    }

    // Kiểm tra username đã tồn tại chưa
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: 'Username đã được sử dụng'
      });
    }

    // Hash mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Tạo người dùng mới
    const newUser = new User({
      username,
      password: hashedPassword,
      role: role || 'user'
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: 'Tạo người dùng thành công',
      user: {
        _id: newUser._id,
        username: newUser.username,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo người dùng'
    });
  }
});

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Cập nhật thông tin người dùng
 * @access  Admin
 */
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, role } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID người dùng không hợp lệ'
      });
    }

    // Kiểm tra người dùng tồn tại
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Kiểm tra username đã tồn tại chưa (nếu thay đổi)
    if (username && username !== user.username) {
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        return res.status(400).json({
          success: false,
          message: 'Username đã được sử dụng'
        });
      }
      user.username = username;
    }

    // Cập nhật password nếu có
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    // Cập nhật các trường khác
    if (role) user.role = role;

    await user.save();

    res.json({
      success: true,
      message: 'Cập nhật người dùng thành công',
      user: {
        _id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật người dùng'
    });
  }
});

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Xóa người dùng
 * @access  Admin
 */
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID người dùng không hợp lệ'
      });
    }

    // Không cho phép xóa chính mình
    if (id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa tài khoản của chính bạn'
      });
    }

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    res.json({
      success: true,
      message: 'Xóa người dùng thành công'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xóa người dùng'
    });
  }
});

module.exports = router;

// ========================
//        ADD USER
// ========================
router.get('/admin/users/add-user', (req, res) => {
    res.render('admin/add-user'); // View thêm user
});

router.post('/admin/users/add-user', async (req, res) => {
    try {
        const { username, password, role } = req.body;

        // Kiểm tra trùng username
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.send('Username đã tồn tại!');
        }

        // Mã hóa password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Tạo user mới
        const newUser = new User({
            username,
            password: hashedPassword,
            role
        });

        await newUser.save();

        res.redirect('/admin/users');
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi máy chủ khi thêm người dùng');
    }
});
