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
        if (!product) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
        }

        const existing = req.session.cart.find(item => item.productId === product._id.toString());

        if (existing) {
            existing.quantity += 1;
        } else {
            req.session.cart.push({
                productId: product._id.toString(),
                quantity: 1,
                productName: product.name,
                productPrice: product.price,
                productImage: product.image
            });
        }

        req.session.save(() => {
            res.status(200).json({ success: true, message: 'Đã thêm vào giỏ hàng', cart: req.session.cart });
        });
    } catch (err) {
        console.error('Lỗi thêm vào giỏ hàng:', err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// ========================== TĂNG SỐ LƯỢNG ==========================
router.post('/cart/increment/:id', (req, res) => {
    try {
        const { id } = req.params;
        const item = req.session.cart.find(item => item.productId === id);
        if (item) {
            item.quantity += 1;
        }
        req.session.save(() => {
            res.json({ success: true, cart: req.session.cart });
        });
    } catch (err) {
        console.error('Lỗi tăng số lượng:', err);
        res.status(500).json({ success: false, message: "Lỗi tăng số lượng" });
    }
});

// ========================== GIẢM SỐ LƯỢNG ==========================
router.post('/cart/decrement/:id', (req, res) => {
    try {
        const { id } = req.params;
        const index = req.session.cart.findIndex(item => item.productId === id);
        if (index !== -1) {
            if (req.session.cart[index].quantity > 1) {
                req.session.cart[index].quantity -= 1;
            } else {
                req.session.cart.splice(index, 1);
            }
        }
        req.session.save(() => {
            res.json({ success: true, cart: req.session.cart });
        });
    } catch (err) {
        console.error('Lỗi giảm số lượng:', err);
        res.status(500).json({ success: false, message: "Lỗi giảm số lượng" });
    }
});

// ========================== XÓA ==========================
router.post('/cart/remove/:id', (req, res) => {
    try {
        const { id } = req.params;
        req.session.cart = req.session.cart.filter(item => item.productId !== id);
        req.session.save(() => {
            res.status(200).json({ success: true, message: 'Đã xóa sản phẩm khỏi giỏ hàng', cart: req.session.cart });
        });
    } catch (err) {
        console.error('Lỗi xóa sản phẩm:', err);
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
    try {
        res.status(200).json({ success: true, cart: req.session.cart || [] });
    } catch (err) {
        console.error('Lỗi lấy giỏ hàng:', err);
        res.status(500).json({ success: false, message: "Lỗi lấy giỏ hàng" });
    }
});
// ========================== DEBUG GIỎ HÀNG ==========================
router.get('/cart/debug', (req, res) => {
    console.log('Session ID:', req.sessionID);
    console.log('Cart:', req.session.cart);
    res.json({ sessionId: req.sessionID, cart: req.session.cart });
});
module.exports = router;
