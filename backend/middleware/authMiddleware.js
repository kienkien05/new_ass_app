const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Find user with Prisma
            const user = await prisma.user.findUnique({
                where: { id: decoded.id },
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    role: true,
                    avatarUrl: true,
                    isActive: true,
                }
            });

            if (!user || !user.isActive) {
                return res.status(401).json({
                    success: false,
                    message: 'Not authorized, user not found or inactive'
                });
            }

            // Attach user to request (maintaining API compatibility)
            req.user = {
                id: user.id,
                _id: user.id, // For backward compatibility
                email: user.email,
                full_name: user.fullName,
                role: user.role,
                avatar_url: user.avatarUrl,
            };

            next();
        } catch (error) {
            console.error('Auth middleware error:', error);
            return res.status(401).json({
                success: false,
                message: 'Not authorized, token failed'
            });
        }
    } else {
        return res.status(401).json({
            success: false,
            message: 'Not authorized, no token'
        });
    }
};

const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({
            success: false,
            message: 'Not authorized as an admin'
        });
    }
};

const optionalProtect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await prisma.user.findUnique({
                where: { id: decoded.id },
                select: { id: true, role: true, isActive: true }
            });

            if (user && user.isActive) {
                req.user = user;
            }
        } catch (error) {
            // Token invalid or expired - just ignore and proceed as guest
            // console.error('Optional auth error:', error.message);
        }
    }
    next();
};

module.exports = { protect, admin, optionalProtect };
