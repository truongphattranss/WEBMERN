const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Middleware: Đảm bảo req.session.cart luôn tồn tại
router.use((req, res, next) => {
    if (!req.session.cart) {
        req.session.cart = [];
    }
    next();
});

// ========================== THÊM SẢN PHẨM VÀO GIỎ HÀNG ==========================
router.post('/cart/add/:id', async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
  
      const existing = req.session.cart.find(item => item.productId == product._id);
      if (existing) {
        existing.quantity += 1;
      } else {
        req.session.cart.push({ productId: product._id, quantity: 1, productName: product.name, productPrice: product.price, productImage: product.image });
      }
  
      res.status(200).json({ message: 'Đã thêm vào giỏ hàng', cart: req.session.cart });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Lỗi server' });
    }
});

// ========================== TĂNG SỐ LƯỢNG ==========================
router.post('/cart/increment/:id', (req, res) => {
    try {
        const { id } = req.params;
        const existing = req.session.cart.find(item => item.productId == id);
        if (existing) {
            existing.quantity += 1;
        }
        res.json({ success: true, cart: req.session.cart });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Lỗi tăng số lượng" });
    }
});

// ========================== GIẢM SỐ LƯỢNG ==========================
router.post('/cart/decrement/:id', (req, res) => {
    try {
        const { id } = req.params;
        const index = req.session.cart.findIndex(item => item.productId == id);
        if (index !== -1) {
            if (req.session.cart[index].quantity > 1) {
                req.session.cart[index].quantity -= 1;
            } else {
                req.session.cart.splice(index, 1);
            }
        }
        res.json({ success: true, cart: req.session.cart });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Lỗi giảm số lượng" });
    }
});

// ========================== XÓA ==========================
router.post('/cart/remove/:id', (req, res) => {
    try {
        const { id } = req.params;
        req.session.cart = req.session.cart.filter(item => item.productId.toString() !== id.toString());
        req.session.save(() => {
            res.status(200).json({ success: true, cart: req.session.cart });
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Lỗi xóa sản phẩm khỏi giỏ hàng" });
    }
});

// ========================== XÓA TOÀN BỘ GIỎ HÀNG ==========================
router.post('/cart/clear', (req, res) => {
    try {
        req.session.cart = [];
        req.session.save(() => {
            res.status(200).json({ success: true, message: "Đã xóa toàn bộ giỏ hàng", cart: [] });
        });
    } catch (err) {
        console.error('Lỗi xóa toàn bộ giỏ hàng:', err);
        res.status(500).json({ success: false, message: "Lỗi xóa toàn bộ giỏ hàng" });
    }
});

// ========================== XEM GIỎ HÀNG ==========================
router.get('/cart', (req, res) => {
    res.status(200).json({ cart: req.session.cart });
});

module.exports = router;
