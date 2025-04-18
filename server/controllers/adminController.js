const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');

// Cấu hình upload ảnh
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file ảnh (.jpg, .jpeg, .png, .webp)'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB
}).single('image');

module.exports = {
  // ========================
  //        DASHBOARD
  // ========================
  showDashboard: async (req, res) => {
    try {
      const stats = {
        totalUsers: await User.countDocuments(),
        totalProducts: await Product.countDocuments(),
        totalOrders: await Order.countDocuments(),
        recentOrders: await Order.find().sort({ createdAt: -1 }).limit(5).populate('userId'),
      };
      res.render('admin/dashboard', { stats, title: 'Bảng điều khiển' });
    } catch (error) {
      console.error(error);
      res.status(500).send('Lỗi server');
    }
  },

  // ========================
  //         USERS
  // ========================
  listUsers: async (req, res) => {
    try {
      const users = await User.find().sort({ createdAt: -1 });
      res.render('admin/users', { users, title: 'Quản lý Người dùng' });
    } catch (error) {
      console.error(error);
      res.status(500).send('Lỗi server');
    }
  },

  showEditUser: async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) return res.redirect('/admin/users');

      res.render('admin/edit-user', { user, title: 'Chỉnh sửa Người dùng' });
    } catch (error) {
      console.error(error);
      res.redirect('/admin/users');
    }
  },

  updateUser: async (req, res) => {
    try {
      const { username, role, newPassword } = req.body;
      const updateData = { username, role };

      if (newPassword) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        updateData.password = hashedPassword;
      }

      await User.findByIdAndUpdate(req.params.id, updateData);
      res.redirect('/admin/users');
    } catch (error) {
      console.error(error);
      res.redirect('/admin/users');
    }
  },

  deleteUser: async (req, res) => {
    try {
      await User.findByIdAndDelete(req.params.id);
      res.redirect('/admin/users');
    } catch (error) {
      console.error(error);
      res.redirect('/admin/users');
    }
  },

  // ========================
  //        PRODUCTS
  // ========================
  listProducts: async (req, res) => {
    try {
      const products = await Product.find().sort({ createdAt: -1 });
      res.render('admin/products', { products, title: 'Quản lý Sản phẩm' });
    } catch (error) {
      console.error(error);
      res.status(500).send('Lỗi server');
    }
  },

  showCreateProduct: (req, res) => {
    res.render('admin/add-product', { title: 'Thêm Sản phẩm' });
  },

  createProduct: (req, res) => {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).send(err.message);
      }

      try {
        const { name, price, category, description } = req.body;
        const newProduct = new Product({
          name,
          price,
          category,
          description,
          image: req.file ? `/uploads/${req.file.filename}` : '', // Fix lỗi nếu không có file
        });

        await newProduct.save();
        res.redirect('/admin/products');
      } catch (error) {
        console.error(error);
        res.status(500).send('Lỗi server');
      }
    });
  },

  showEditProduct: async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) return res.redirect('/admin/products');

      res.render('admin/edit-product', { product, title: 'Chỉnh sửa Sản phẩm' });
    } catch (error) {
      console.error(error);
      res.redirect('/admin/products');
    }
  },

  updateProduct: (req, res) => {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).send(err.message);
      }

      try {
        const { name, price, category, description } = req.body;
        const updateData = { name, price, category, description };

        if (req.file) {
          updateData.image = `/uploads/${req.file.filename}`;
        }

        await Product.findByIdAndUpdate(req.params.id, updateData);
        res.redirect('/admin/products');
      } catch (error) {
        console.error(error);
        res.redirect('/admin/products');
      }
    });
  },

  deleteProduct: async (req, res) => {
    try {
      await Product.findByIdAndDelete(req.params.id);
      res.redirect('/admin/products');
    } catch (error) {
      console.error(error);
      res.redirect('/admin/products');
    }
  },

  // ========================
  //         ORDERS
  // ========================

  // 🛒 Lấy danh sách đơn hàng, sắp xếp mới nhất trước
  listOrders: async (req, res) => {
    try {
      const orders = await Order.find()
        .sort({ createdAt: -1 })
        .populate('userId');
      
      res.render('admin/orders', { orders, title: 'Quản lý Đơn hàng' });
    } catch (error) {
      console.error('Lỗi khi lấy danh sách đơn hàng:', error);
      res.status(500).send('Lỗi server');
    }
  },

  // 📦 Hiển thị chi tiết đơn hàng
  showOrderDetail: async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.redirect('/admin/orders'); // Nếu ID không hợp lệ, quay về danh sách
      }

      const order = await Order.findById(req.params.id)
        .populate('userId')
        .populate('products.productId');

      if (!order) {
        req.flash('error', 'Đơn hàng không tồn tại');
        return res.redirect('/admin/orders');
      }

      res.render('admin/order-detail', { order, title: 'Chi tiết Đơn hàng' });
    } catch (error) {
      console.error('Lỗi khi lấy chi tiết đơn hàng:', error);
      req.flash('error', 'Có lỗi xảy ra khi tải đơn hàng');
      res.redirect('/admin/orders');
    }
  },

  // ✅ Cập nhật trạng thái đơn hàng
  updateOrderStatus: async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ error: 'ID đơn hàng không hợp lệ' });
      }

      const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
      const { status } = req.body;

      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
      }

      const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });

      if (!order) {
        return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
      }

      res.json({ success: true, message: 'Cập nhật thành công', status: order.status });
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái đơn hàng:', error);
      res.status(500).json({ error: 'Cập nhật thất bại, vui lòng thử lại sau' });
    }
  },
};