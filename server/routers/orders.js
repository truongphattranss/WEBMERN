const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { authenticateToken } = require('../middlewares/auth');
const mongoose = require('mongoose');

/**
 * @route   GET /api/orders
 * @desc    Lấy danh sách đơn hàng của người dùng đã đăng nhập
 * @access  Private
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get orders for the current user
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'products.productId',
        select: 'name price images'
      });

    // Get total count for pagination
    const total = await Order.countDocuments({ user: req.user._id });

    res.json({
      success: true,
      orders,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách đơn hàng'
    });
  }
});

/**
 * @route   GET /api/orders/:id
 * @desc    Lấy chi tiết đơn hàng theo ID
 * @access  Private
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID đơn hàng không hợp lệ'
      });
    }

    // Find order and check if it belongs to the current user
    const order = await Order.findOne({
      _id: id,
      user: req.user._id
    }).populate({
      path: 'products.productId',
      select: 'name price images'
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thông tin đơn hàng'
    });
  }
});

/**
 * @route   PATCH /api/orders/:id/cancel
 * @desc    Hủy đơn hàng
 * @access  Private
 */
router.patch('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID đơn hàng không hợp lệ'
      });
    }

    // Find order and check if it belongs to the current user
    const order = await Order.findOne({
      _id: id,
      user: req.user._id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    // Check if order can be cancelled (only pending orders)
    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể hủy đơn hàng đang ở trạng thái chờ xử lý'
      });
    }

    // Update order status
    order.status = 'cancelled';
    await order.save();

    res.json({
      success: true,
      message: 'Đơn hàng đã được hủy thành công',
      order
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi hủy đơn hàng'
    });
  }
});

// Create a new order
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      products,
      name, 
      email, 
      phone, 
      address, 
      city, 
      note,
      paymentMethod,
      totalAmount,
      bankId
    } = req.body;

    // Validate required fields
    if (!products || !products.length || !name || !email || !phone || !address || !paymentMethod || !totalAmount) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin đơn hàng'
      });
    }

    // Create new order with user ID from authenticated user
    const newOrder = new Order({
      user: req.user._id,
      products: products.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      })),
      name,
      email,
      phone,
      address,
      city: city || '',
      note: note || '',
      paymentMethod,
      totalAmount,
      status: 'pending'
    });

    // Add payment details if banking method
    if (paymentMethod === 'banking' && bankId) {
      newOrder.paymentDetails = {
        method: 'banking',
        bankId: bankId
      };
    }

    await newOrder.save();

    res.status(201).json({
      success: true,
      message: 'Đơn hàng đã được tạo thành công',
      order: newOrder
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo đơn hàng'
    });
  }
});

module.exports = router; 