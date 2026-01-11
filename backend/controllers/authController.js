const prisma = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendOTP, verifyOTP, resendOTP } = require('../services/otpService');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '30d',
    });
};

// Store pending registrations temporarily (will be moved to DB in production)
const pendingRegistrations = new Map();

// @desc    Register a new user - Step 1: Send OTP
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    try {
        const { full_name, email, password } = req.body;

        // Validate required fields
        if (!full_name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ thông tin'
            });
        }

        // Check if user exists
        const userExists = await prisma.user.findUnique({
            where: { email }
        });

        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'Email đã được sử dụng'
            });
        }

        // Hash password and store temporarily
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Store pending registration (expires in 10 minutes)
        pendingRegistrations.set(email, {
            fullName: full_name,
            email,
            passwordHash,
            createdAt: Date.now()
        });

        // Send OTP
        const otpResult = await sendOTP(email, 'register');

        if (!otpResult.success) {
            return res.status(500).json({
                success: false,
                message: otpResult.message
            });
        }

        res.status(200).json({
            success: true,
            requireOTP: true,
            message: 'Mã OTP đã được gửi đến email của bạn',
            data: { email }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server trong quá trình đăng ký'
        });
    }
};

// @desc    Verify OTP and complete registration
// @route   POST /api/auth/verify-register
// @access  Public
const verifyRegisterOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập email và mã OTP'
            });
        }

        // Verify OTP
        const otpResult = await verifyOTP(email, otp, 'register');

        if (!otpResult.valid) {
            return res.status(400).json({
                success: false,
                message: otpResult.message
            });
        }

        // Get pending registration
        const pendingData = pendingRegistrations.get(email);

        if (!pendingData) {
            return res.status(400).json({
                success: false,
                message: 'Phiên đăng ký đã hết hạn. Vui lòng đăng ký lại.'
            });
        }

        // Create user
        const user = await prisma.user.create({
            data: {
                fullName: pendingData.fullName,
                email: pendingData.email,
                passwordHash: pendingData.passwordHash,
                isActive: true
            }
        });

        // Clear pending registration
        pendingRegistrations.delete(email);

        res.status(201).json({
            success: true,
            message: 'Đăng ký thành công!',
            data: {
                id: user.id,
                full_name: user.fullName,
                email: user.email,
                role: user.role,
                token: generateToken(user.id),
            },
        });
    } catch (error) {
        console.error('Verify register OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server trong quá trình xác thực'
        });
    }
};

// @desc    Auth user - Step 1: Verify password and send OTP
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Email hoặc mật khẩu không đúng'
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Tài khoản đã bị vô hiệu hóa'
            });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.passwordHash);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Email hoặc mật khẩu không đúng'
            });
        }

        // Send OTP for login verification
        const otpResult = await sendOTP(email, 'login');

        if (!otpResult.success) {
            return res.status(500).json({
                success: false,
                message: otpResult.message
            });
        }

        res.json({
            success: true,
            requireOTP: true,
            message: 'Mã OTP đã được gửi đến email của bạn',
            data: { email }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server trong quá trình đăng nhập'
        });
    }
};

// @desc    Verify OTP and complete login
// @route   POST /api/auth/verify-login
// @access  Public
const verifyLoginOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập email và mã OTP'
            });
        }

        // Verify OTP
        const otpResult = await verifyOTP(email, otp, 'login');

        if (!otpResult.valid) {
            return res.status(400).json({
                success: false,
                message: otpResult.message
            });
        }

        // Get user
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        res.json({
            success: true,
            message: 'Đăng nhập thành công!',
            data: {
                id: user.id,
                full_name: user.fullName,
                email: user.email,
                role: user.role,
                avatar_url: user.avatarUrl,
                token: generateToken(user.id),
            },
        });
    } catch (error) {
        console.error('Verify login OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server trong quá trình xác thực'
        });
    }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOTPCode = async (req, res) => {
    try {
        const { email, type } = req.body;

        if (!email || !type) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp email và loại OTP'
            });
        }

        if (!['register', 'login'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Loại OTP không hợp lệ'
            });
        }

        const result = await resendOTP(email, type);

        res.json({
            success: result.success,
            message: result.message
        });
    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi gửi lại OTP'
        });
    }
};

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
const getUserProfile = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                avatarUrl: true,
                phoneNumber: true,
                facebookUrl: true,
                gender: true,
                address: true,
                dateOfBirth: true,
                createdAt: true,
            }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        res.json({
            success: true,
            data: {
                id: user.id,
                full_name: user.fullName,
                email: user.email,
                role: user.role,
                avatar_url: user.avatarUrl,
                phone_number: user.phoneNumber,
                facebook_url: user.facebookUrl,
                gender: user.gender,
                address: user.address,
                date_of_birth: user.dateOfBirth,
                created_at: user.createdAt,
            },
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

module.exports = {
    registerUser,
    verifyRegisterOTP,
    loginUser,
    verifyLoginOTP,
    resendOTPCode,
    getUserProfile
};
