const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { authenticateToken, isAdmin } = require('../middlewares/auth');
const mongoose = require('mongoose');

// Lấy tất cả đơn hàng với các tùy chọn lọc
router.get('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    // Lấy các tham số từ query
    const { search, status, dateFrom, dateTo, page = 1, limit = 10 } = req.query;
    
    // Xây dựng điều kiện tìm kiếm
    const filter = {};
    
    // Lọc theo trạng thái
    if (status) {
      filter.status = status;
    }
    
    // Tìm kiếm theo thông tin khách hàng, email, ID
    if (search) {
      console.log(`Đang tìm kiếm với từ khóa: "${search}"`);
      
      // Regex an toàn: escape các ký tự đặc biệt trong regex
      const escapeRegex = (string) => {
        return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      };
      
      const safeSearch = escapeRegex(search);
      console.log(`Safe search term: "${safeSearch}"`);
      
      // Tìm kiếm các đơn hàng dựa trên username
      const usersWithMatchingUsername = await mongoose.model('User').find(
        { username: { $regex: safeSearch, $options: 'i' } },
        '_id'
      ).lean();
      
      // Nếu tìm thấy user phù hợp, tìm các đơn hàng của họ
      let userIds = [];
      if (usersWithMatchingUsername.length > 0) {
        userIds = usersWithMatchingUsername.map(user => user._id);
        console.log(`Tìm thấy ${userIds.length} người dùng có username khớp với "${search}"`);
      }
      
      // Tìm kiếm thông tin khách hàng: tên, email, số điện thoại, địa chỉ, nội dung chuyển khoản
      filter.$or = [
        { name: { $regex: safeSearch, $options: 'i' } },          // Tên khách hàng
        { email: { $regex: safeSearch, $options: 'i' } },         // Email khách hàng
        { phone: { $regex: safeSearch, $options: 'i' } },         // Số điện thoại
        { address: { $regex: safeSearch, $options: 'i' } },       // Địa chỉ
        { city: { $regex: safeSearch, $options: 'i' } },          // Thành phố
        { 'paymentDetails.transferContent': { $regex: safeSearch, $options: 'i' } } // Nội dung chuyển khoản
      ];
      
      // Thêm điều kiện tìm kiếm theo user
      if (userIds.length > 0) {
        filter.$or.push({ user: { $in: userIds } });
      }
      
      // Kiểm tra chi tiết hơn về field 'name'
      const sampleOrder = await Order.findOne({}).lean();
      if (sampleOrder) {
        console.log('Sample order fields:', Object.keys(sampleOrder));
        console.log('Sample order name field:', sampleOrder.name);
      }
      
      // Tìm theo ID đầy đủ nếu là ObjectId hợp lệ
      if (/^[0-9a-fA-F]{24}$/.test(search)) {
        try {
          const objId = new mongoose.Types.ObjectId(search);
          filter.$or.push({ _id: objId });
          console.log(`Đã thêm điều kiện tìm theo ObjectId đầy đủ: ${search}`);
        } catch (e) {
          console.log('ID không hợp lệ:', e.message);
        }
      }
      
      // Tìm theo một phần ID (không sử dụng regex với MongoDB ObjectIds)
      if (/^[0-9a-fA-F]+$/.test(search) && search.length >= 4) {
        console.log(`Tìm theo phần cuối của ID: ${search}`);
        
        try {
          // Tìm tất cả đơn hàng
          const allOrders = await Order.find({}, '_id').lean();
          // Lọc các ID kết thúc bằng search
          const matchingOrderIds = allOrders
            .filter(order => {
              const idString = order._id.toString();
              // Kiểm tra nếu chuỗi tìm kiếm là 8 ký tự cuối của ID (short ID)
              // Hoặc tìm kiếm là một phần của ID
              return idString.endsWith(search) || idString.includes(search);
            })
            .map(order => order._id);
          
          console.log(`Tìm thấy ${matchingOrderIds.length} đơn hàng có ID chứa "${search}"`);
          
          if (matchingOrderIds.length > 0) {
            filter.$or.push({ _id: { $in: matchingOrderIds } });
          }
        } catch (err) {
          console.error('Lỗi khi tìm kiếm theo phần ID:', err);
        }
      }
      
      console.log('Final filter $or conditions:', filter.$or.length);
    }
    
    // Lọc theo ngày
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) {
        filter.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        // Đặt thời gian đến cuối ngày
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = endDate;
      }
    }
    
    console.log('Final filter:', JSON.stringify(filter, null, 2));
    
    // Đếm tổng số đơn hàng thỏa mãn điều kiện
    const total = await Order.countDocuments(filter);
    
    // Tính toán skip và limit cho phân trang
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const pageLimit = parseInt(limit);
    
    // Lấy danh sách đơn hàng với phân trang và lọc
    const orders = await Order.find(filter)
      .populate('user', 'username email')
      .populate('products.productId', 'name price image')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageLimit);
    
    console.log(`Tìm thấy ${orders.length} đơn hàng từ tổng số ${total}`);
    
    // Hiển thị thông tin chi tiết về kết quả tìm kiếm
    if (search && orders.length > 0) {
      console.log('Kết quả tìm kiếm:');
      orders.forEach((order, index) => {
        console.log(`#${index + 1}: ID=${order._id}, Tên=${order.name}, Email=${order.email}`);
      });
    }
    
    // Trả về kết quả
    res.json({
      success: true,
      orders,
      pagination: {
        total,
        page: parseInt(page),
        limit: pageLimit,
        totalPages: Math.ceil(total / pageLimit)
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi lấy danh sách đơn hàng'
    });
  }
});

// Lấy thống kê đơn hàng - phải đặt trước route /:id
router.get('/stats', authenticateToken, isAdmin, async (req, res) => {
  try {
    // Tổng số đơn hàng
    const totalOrders = await Order.countDocuments();
    
    // Số đơn hàng theo trạng thái
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const processingOrders = await Order.countDocuments({ status: 'processing' });
    const shippedOrders = await Order.countDocuments({ status: 'shipped' });
    const deliveredOrders = await Order.countDocuments({ status: 'delivered' });
    const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });
    const paidOrders = await Order.countDocuments({ status: 'paid' });
    const failedOrders = await Order.countDocuments({ status: 'failed' });
    
    // Tính tổng doanh thu từ đơn hàng đã giao
    const revenue = await Order.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
    ]);
    
    const totalRevenue = revenue.length > 0 ? revenue[0].totalRevenue : 0;
    
    // Đơn hàng theo thời gian (7 ngày gần nhất)
    const today = new Date();
    const last7Days = new Date(today);
    last7Days.setDate(today.getDate() - 7);
    
    const ordersByDate = await Order.aggregate([
      { $match: { createdAt: { $gte: last7Days } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Trả về thống kê
    res.json({
      success: true,
      stats: {
        totalOrders,
        pendingOrders,
        processingOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        paidOrders,
        failedOrders,
        totalRevenue,
        ordersByDate
      }
    });
  } catch (error) {
    console.error('Error fetching order statistics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi lấy thống kê đơn hàng'
    });
  }
});

// Lấy thông tin chi tiết đơn hàng theo ID
router.get('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    // Kiểm tra ID hợp lệ
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID đơn hàng không hợp lệ'
      });
    }
    
    // Tìm đơn hàng theo ID và populate thông tin liên quan
    const order = await Order.findById(req.params.id)
      .populate('user', 'username email')
      .populate('products.productId', 'name price image category');
    
    // Kiểm tra nếu đơn hàng không tồn tại
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy đơn hàng'
      });
    }
    
    // Trả về thông tin đơn hàng
    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error(`Error fetching order ID ${req.params.id}:`, error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi lấy thông tin đơn hàng'
    });
  }
});

// Cập nhật trạng thái đơn hàng
router.patch('/:id/status', authenticateToken, isAdmin, async (req, res) => {
  try {
    // Kiểm tra ID hợp lệ
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID đơn hàng không hợp lệ'
      });
    }
    
    const { status } = req.body;
    
    // Kiểm tra trạng thái hợp lệ
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'paid', 'failed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Trạng thái không hợp lệ'
      });
    }
    
    // Cập nhật trạng thái đơn hàng
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('user', 'username email')
     .populate('products.productId', 'name price image');
    
    // Kiểm tra nếu đơn hàng không tồn tại
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy đơn hàng'
      });
    }
    
    // Trả về thông tin đơn hàng đã cập nhật
    res.json({
      success: true,
      message: 'Cập nhật trạng thái thành công',
      order
    });
  } catch (error) {
    console.error(`Error updating order status for ID ${req.params.id}:`, error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi cập nhật trạng thái đơn hàng'
    });
  }
});

// Xóa đơn hàng
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    // Kiểm tra ID hợp lệ
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID đơn hàng không hợp lệ'
      });
    }
    
    // Xóa đơn hàng
    const result = await Order.findByIdAndDelete(req.params.id);
    
    // Kiểm tra nếu đơn hàng không tồn tại
    if (!result) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy đơn hàng'
      });
    }
    
    // Trả về kết quả thành công
    res.json({
      success: true,
      message: 'Đã xóa đơn hàng thành công'
    });
  } catch (error) {
    console.error(`Error deleting order ID ${req.params.id}:`, error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi xóa đơn hàng'
    });
  }
});

module.exports = router;
