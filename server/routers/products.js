const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');


// ========================== ROUTES API JSON ==========================

// API để lấy tất cả danh mục - đặt trước các route khác để ưu tiên xử lý
router.get('/categories', async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true })
            .select('_id name slug description image')
            .sort({ name: 1 });
        
        res.json(categories);
    } catch (err) {
        console.error('Lỗi khi lấy danh sách danh mục:', err);
        res.status(500).json({ 
            success: false, 
            message: "Lỗi khi lấy danh sách danh mục" 
        });
    }
});

// API trả về danh sách sản phẩm dạng JSON cho frontend React
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 9, category, search, sort } = req.query;
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        const skip = (pageNumber - 1) * limitNumber;
        
        // Xây dựng điều kiện tìm kiếm
        const filter = {};
        
        // Lọc theo danh mục
        if (category) {
            filter.category = category;
        }
        
        // Tìm kiếm theo tên sản phẩm
        if (search) {
            filter.name = { $regex: search, $options: 'i' };
        }
        
        // Tạo query sắp xếp
        let sortQuery = {};
        if (sort) {
            const [sortField, sortDirection] = sort.split(':');
            sortQuery[sortField] = sortDirection === 'desc' ? -1 : 1;
        } else {
            // Mặc định sắp xếp theo createdAt giảm dần (mới nhất trước)
            sortQuery = { createdAt: -1 };
        }
        
        // Thực hiện query với filter và pagination
        const totalProducts = await Product.countDocuments(filter);
        
        // Truy vấn sản phẩm với populate để lấy thông tin danh mục
        const products = await Product.find(filter)
            .populate('category', 'name')
            .sort(sortQuery)
            .skip(skip)
            .limit(limitNumber);
        
        // Trả về kết quả với thông tin phân trang
        res.json({
            success: true,
            products,
            pagination: {
                total: totalProducts,
                page: pageNumber,
                limit: limitNumber,
                totalPages: Math.ceil(totalProducts / limitNumber)
            }
        });
    } catch (err) {
        console.error('Lỗi khi lấy danh sách sản phẩm:', err);
        res.status(500).json({ 
            success: false, 
            message: "Lỗi lấy danh sách sản phẩm" 
        });
    }
});



// API trả về chi tiết 1 sản phẩm (✅ ĐÃ SỬA)
router.get('/:id', async (req, res) => {
    try {
        const id = req.params.id.trim(); // ✅ Trim để loại bỏ \n hoặc space
        const product = await Product.findById(id).populate('category', 'name');

        if (!product) return res.status(404).json({ message: "Sản phẩm không tồn tại" });

        const formattedProduct = {
            ...product._doc,
            image: `${req.protocol}://${req.get('host')}${product.image}`
        };

        res.json({ product: formattedProduct });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi lấy chi tiết sản phẩm" });
    }
});

// API để lấy thông tin danh mục theo ID
router.get('/categories/:id', async (req, res) => {
    try {
        const categoryId = req.params.id.trim();
        const category = await Category.findById(categoryId);
        
        if (!category) {
            return res.status(404).json({ 
                success: false, 
                message: "Danh mục không tồn tại" 
            });
        }
        
        res.json({ 
            success: true, 
            category: {
                _id: category._id,
                name: category.name,
                slug: category.slug
            } 
        });
    } catch (err) {
        console.error('Error fetching category:', err);
        res.status(500).json({ 
            success: false, 
            message: "Lỗi khi lấy thông tin danh mục" 
        });
    }
});

// ========================== ROUTES RENDER VIEW (cho EJS dùng) ==========================

// Trang chủ, redirect về /product
router.get('/', (req, res) => res.redirect('/product'));

// Trang danh sách sản phẩm EJS
router.get('/index', async (req, res) => {
    try {
        const products = await Product.find();
        res.render('index', { products, user: req.user || null });
    } catch (err) {
        console.error(err);
        res.status(500).send("Lỗi lấy danh sách sản phẩm");
    }
});

// Danh sách sản phẩm có phân trang
router.get('/product', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 9; // Hiển thị 9 sản phẩm mỗi trang
    const skip = (page - 1) * limit;

    try {
        const totalProducts = await Product.countDocuments();
        const products = await Product.find().skip(skip).limit(limit);
        const totalPages = Math.ceil(totalProducts / limit);

        res.render('product-list', { products, currentPage: page, totalPages });
    } catch (err) {
        console.error(err);
        res.status(500).send("Lỗi khi lấy danh sách sản phẩm");
    }
});

// Trang chi tiết sản phẩm EJS
router.get('/product/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).send("Sản phẩm không tồn tại");
        res.render('product-detail', { product });
    } catch (err) {
        console.error(err);
        res.status(500).send("Lỗi lấy chi tiết sản phẩm");
    }
});

module.exports = router;
