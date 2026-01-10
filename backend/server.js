const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Load env vars
dotenv.config();

const app = express();

// Trust proxy for rate limiting behind Docker/nginx
app.set('trust proxy', 1);

// Security middleware - configured to allow cross-origin images
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false, // Allow embedding resources
}));

// Rate limiting - 100 requests per 15 minutes per IP
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10, // Only 10 login attempts per 15 minutes
    message: {
        success: false,
        message: 'Too many login attempts, please try again after 15 minutes.'
    },
});

// Body parser
app.use(express.json({ limit: '10kb' })); // Limit body size

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : ['http://localhost:3000', 'http://localhost:5173'];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
}));

// Routes
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const orderRoutes = require('./routes/orderRoutes');
const roomRoutes = require('./routes/roomRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
const ticketTypeRoutes = require('./routes/ticketTypeRoutes');
const userRoutes = require('./routes/userRoutes');
const reportRoutes = require('./routes/reportRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const path = require('path');
const { protect } = require('./middleware/authMiddleware');
const { getMyTickets } = require('./controllers/orderController');

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/ticket-types', ticketTypeRoutes);
app.use('/api/admin/users', userRoutes);
app.use('/api/admin/reports', reportRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve uploaded files

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Basic Route
app.get('/', (req, res) => {
    res.json({
        message: 'EViENT API is running...',
        version: '2.0.0',
        database: 'PostgreSQL + Prisma'
    });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📦 Database: PostgreSQL + Prisma`);
});
