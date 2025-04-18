require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const app = express();
const PORT = process.env.PORT || 5000;

// Debug environment variables
console.log('⚙️ Environment:', process.env.NODE_ENV);
console.log('🔑 JWT_SECRET:', process.env.JWT_SECRET ? 'Configured' : 'Missing');
console.log('🗄️ MongoDB URI:', process.env.MONGODB_URI ? 'Configured' : 'Using default');

// Trust proxy for Render
app.set('trust proxy', 1);

// Import models
const Order = require('./models/Order');

// Import routes
const userRoutes = require('./routers/users');
const productRoutes = require('./routers/products');
const searchRoutes = require('./routers/search');
const cartRoutes = require('./routers/cart');
const checkoutRoutes = require('./routers/checkout');
const paymentRoutes = require('./routers/payment');
const aboutRoutes = require('./routers/about');
const adminUserRoutes = require('./routers/admin-user');
const adminProductRoutes = require('./routers/admin-product');
const adminOrderRoutes = require('./routers/admin-order');
const adminStatsRoutes = require('./routers/admin-stats');
const adminCategoryRoutes = require('./routers/admin-category');
const ordersRoutes = require('./routers/orders');

// ========================== DATABASE CONNECTION ==========================
mongoose.connect(process.env.MONGODB_URI || '', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB Connected Successfully'))
.catch(err => {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
});

mongoose.connection.on('error', err => {
    console.error('MongoDB Error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('❌ MongoDB Disconnected');
});

// ========================== MIDDLEWARE ==========================
// Core Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

// ✅ CORS Middleware (chỉ gọi 1 lần)
app.use(cors({
    origin: process.env.CLIENT_URL || 'https://curvotech.vercel.app',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// ✅ Session Middleware
app.use(session({
    secret: process.env.SESSION_SECRET || '123',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI || '',
        ttl: 24 * 60 * 60 // 1 day
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
}));

// ✅ Logging Middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// ========================== ROUTES ==========================
const API_PREFIX = '/api';

app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/products`, productRoutes);
app.use(`${API_PREFIX}/search`, searchRoutes);
app.use(`${API_PREFIX}/cart`, cartRoutes);
app.use(`${API_PREFIX}/checkout`, checkoutRoutes);
app.use(`${API_PREFIX}/payment`, paymentRoutes);
app.use(`${API_PREFIX}/about`, aboutRoutes);
app.use(`${API_PREFIX}/orders`, ordersRoutes);

// Admin Routes
app.use(`${API_PREFIX}/admin/users`, adminUserRoutes);
app.use(`${API_PREFIX}/admin/products`, adminProductRoutes);
app.use(`${API_PREFIX}/admin/orders`, adminOrderRoutes);
app.use(`${API_PREFIX}/admin/categories`, adminCategoryRoutes);
app.use(`${API_PREFIX}/admin`, adminStatsRoutes);

// ✅ Session Test Route
app.get('/api/session', (req, res) => {
    if (!req.session.views) req.session.views = 0;
    req.session.views++;
    res.json({
        message: 'Session active!',
        views: req.session.views,
        sessionID: req.sessionID,
    });
});

// Health Check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok',
        timestamp: new Date(),
        uptime: process.uptime()
    });
});

// 404 Handler
app.use('*', (req, res) => {
    res.status(404).json({ 
        success: false, 
        message: 'API endpoint không tồn tại'
    });
});

// ========================== ERROR HANDLING ==========================
app.use((err, req, res, next) => {
    console.error('❌ Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: process.env.NODE_ENV === 'development' 
            ? err.message 
            : 'Có lỗi xảy ra từ server!',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// ========================== SERVER STARTUP ==========================
const server = app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        mongoose.connection.close(false, () => {
            console.log('💤 Server closed. Database connections terminated.');
            process.exit(0);
        });
    });
});

process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Promise Rejection:', err);
    server.close(() => {
        process.exit(1);
    });
});
