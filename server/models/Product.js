const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true }, // Link ảnh sản phẩm
    category: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Category',
        required: true 
    },
    // For backward compatibility
    categoryName: { type: String },
    rating: { type: Number, default: 0 }, // Mặc định là 0 nếu không có đánh giá
    description: { type: String, required: true }
}, {
    timestamps: true
});

// Index for faster queries
productSchema.index({ name: 1 });
productSchema.index({ category: 1 });
productSchema.index({ categoryName: 1 });

const Product = mongoose.model('Product', productSchema); 

module.exports = Product;
