const express = require('express');
const Order = require('../models/Order'); // Đảm bảo đường dẫn đúng đến mô hình Order
const router = express.Router();

// GET /checkout: Hiển thị trang thanh toán
router.get('/checkout', async (req, res) => {
  try {
    req.session.cart = req.session.cart || [];
    if (req.session.cart.length === 0) {
      return res.render('checkout', { 
        cart: [], 
        message: "Giỏ hàng của bạn đang trống!", 
        totalAmount: 0 
      });
    }
    const totalAmount = req.session.cart.reduce((sum, item) => {
      const quantity = item.quantity || 1;
      return sum + item.price * quantity;
    }, 0);
    res.render('checkout', { 
      cart: req.session.cart, 
      message: "", 
      totalAmount 
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Lỗi tải trang thanh toán");
  }
});

// POST /checkout: Xử lý đơn hàng thanh toán
router.post("/checkout", async (req, res) => {
  try {
      const { name, email, phone, address, paymentMethod } = req.body;
      req.session.cart = req.session.cart || [];
      
      if (req.session.cart.length === 0) {
          return res.redirect("/checkout");
      }
      
      if (!name || !email || !phone || !address || !paymentMethod) {
          const totalAmount = req.session.cart.reduce((sum, item) => {
              const quantity = item.quantity || 1;
              return sum + item.price * quantity;
          }, 0);
          return res.render('checkout', { 
              cart: req.session.cart, 
              message: "Vui lòng điền đầy đủ thông tin thanh toán!", 
              totalAmount 
          });
      }

      // Tính tổng số tiền
      const totalAmount = req.session.cart.reduce((sum, item) => {
          const quantity = item.quantity || 1;
          return sum + item.price * quantity;
      }, 0);

      // Tạo đối tượng đơn hàng
      const order = new Order({
          userId: req.user ? req.user._id : null, // Nếu có người dùng đã đăng nhập
          products: req.session.cart.map(item => ({
              productId: item._id,
              quantity: item.quantity || 1
          })),
          name,
          email,
          phone,
          address,
          paymentMethod,
          totalAmount
      });

      // Lưu đơn hàng vào cơ sở dữ liệu
      await order.save();

      // Xóa giỏ hàng sau khi thanh toán thành công
      req.session.cart = [];
      req.session.save(() => res.send("Thanh toán thành công! Đơn hàng của bạn sẽ được xử lý."));
  } catch (err) {
      console.error(err);
      res.status(500).send("Lỗi xử lý thanh toán");
  }
});

// POST /checkout/increment/:id: Tăng số lượng sản phẩm theo _id
router.post('/checkout/increment/:id', (req, res) => {
  try {
    const { id } = req.params;
    req.session.cart = req.session.cart || [];
    const index = req.session.cart.findIndex(item => item._id.toString() === id.toString());
    if (index !== -1) {
      req.session.cart[index].quantity = (req.session.cart[index].quantity || 1) + 1;
    }
    req.session.save(() => {
      res.json({ success: true, cart: req.session.cart });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Lỗi tăng số lượng sản phẩm" });
  }
});

// POST /checkout/decrement/:id: Giảm số lượng sản phẩm theo _id (xóa nếu số lượng = 0)
router.post('/checkout/decrement/:id', (req, res) => {
  try {
    const { id } = req.params;
    req.session.cart = req.session.cart || [];
    const index = req.session.cart.findIndex(item => item._id.toString() === id.toString());
    if (index !== -1) {
      if ((req.session.cart[index].quantity || 1) > 1) {
        req.session.cart[index].quantity = (req.session.cart[index].quantity || 1) - 1;
      } else {
        req.session.cart.splice(index, 1);
      }
    }
    req.session.save(() => {
      res.json({ success: true, cart: req.session.cart });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Lỗi giảm số lượng sản phẩm" });
  }
});

// POST /checkout/remove/:index: Xóa sản phẩm khỏi giỏ hàng theo vị trí (index)
router.post('/checkout/remove/:index', (req, res) => {
  try {
    req.session.cart = req.session.cart || [];
    const index = parseInt(req.params.index, 10);
    if (!isNaN(index) && index >= 0 && index < req.session.cart.length) {
      req.session.cart.splice(index, 1);
    }
    req.session.save(() => {
      res.json({ success: true, cart: req.session.cart });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Lỗi xóa sản phẩm khỏi giỏ hàng" });
  }
});

// API endpoint cho React client
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, address, city, note, products, paymentMethod, totalAmount, bankId } = req.body;
    
    if (!name || !email || !phone || !address || !products || !paymentMethod) {
      return res.status(400).json({ 
        success: false, 
        message: "Vui lòng điền đầy đủ thông tin thanh toán!" 
      });
    }

    // Tạo đối tượng đơn hàng
    const order = new Order({
      userId: req.user ? req.user._id : null, // Nếu có người dùng đã đăng nhập
      products: products.map(item => ({
        productId: item.productId,
        quantity: item.quantity || 1
      })),
      name,
      email,
      phone,
      address,
      city,
      note,
      paymentMethod,
      totalAmount,
      status: 'pending'
    });

    // Thêm thông tin ngân hàng nếu là chuyển khoản
    if (paymentMethod === 'banking' && bankId) {
      order.paymentDetails = {
        method: 'banking',
        bankId: bankId
      };
    }

    // Lưu đơn hàng vào cơ sở dữ liệu
    const savedOrder = await order.save();

    // Trả về thông tin đơn hàng
    res.json({
      success: true,
      message: "Đơn hàng đã được tạo thành công!",
      orderId: savedOrder._id
    });
  } catch (err) {
    console.error("Lỗi xử lý thanh toán:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi xử lý thanh toán",
      error: err.message
    });
  }
});

module.exports = router;
